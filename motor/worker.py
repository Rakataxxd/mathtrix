"""Motor de Mathtrix: proceso persistente (JSON por linea en stdin/stdout).

ops:
  resolver -> calcula cada paso con sympy (exacto) y verifica el resultado.
  tts      -> voz neural edge-tts con marcas de tiempo por palabra (cache por frase).
  ping     -> salud.
Las librerias pesadas se importan solo cuando hacen falta.
"""
import sys, json, asyncio, os, hashlib, re, threading, time

_sympy = None


def S():
    global _sympy
    if _sympy is None:
        import sympy
        _sympy = sympy
    return _sympy


def namespace():
    sp = S()
    deg = sp.pi / 180
    ns = {
        "pi": sp.pi, "π": sp.pi, "e": sp.E, "sqrt": sp.sqrt, "raiz": sp.sqrt,
        "sen": lambda x: sp.sin(x * deg), "sin": lambda x: sp.sin(x * deg),
        "cos": lambda x: sp.cos(x * deg), "tan": lambda x: sp.tan(x * deg),
        "asen": lambda x: sp.asin(x) / deg, "acos": lambda x: sp.acos(x) / deg,
        "atan": lambda x: sp.atan(x) / deg,
        "ln": sp.log, "log": lambda x, b=10: sp.log(x, b), "exp": sp.exp,
        "abs": sp.Abs, "factorial": sp.factorial, "C": sp.binomial,
        "comb": sp.binomial, "P": lambda n, k: sp.factorial(n) / sp.factorial(n - k),
        "redondear": lambda x, d=0: sp.Float(round(float(x), int(d))),
        "piso": sp.floor, "techo": sp.ceiling, "min": sp.Min, "max": sp.Max,
    }
    return ns


def limpiar(expr):
    s = str(expr)
    s = s.replace("·", "*").replace("×", "*").replace("÷", "/").replace("−", "-")
    s = s.replace("^", "**").replace("²", "**2").replace("³", "**3")
    s = re.sub(r"(\d),(\d{3})", r"\1\2", s)  # 12,000 -> 12000
    return s


def evaluar(expr, ctx):
    sp = S()
    loc = dict(namespace())
    loc.update(ctx)
    return sp.sympify(limpiar(expr), locals=loc, rational=True)


def fmt_num(v, decimales=2, como="decimal"):
    sp = S()
    try:
        v = sp.nsimplify(v) if como == "fraccion" else v
    except Exception:
        pass
    if como == "fraccion" and getattr(v, "is_Rational", False) and not v.is_Integer:
        return f"{v.p}/{v.q}"
    f = float(sp.N(v, 30))
    if como == "porcentaje":
        f = f * 100
    if abs(f - round(f)) < 1e-9 and abs(f) < 1e15:
        s = f"{int(round(f)):,}"
    else:
        s = f"{f:,.{decimales}f}"
        if "." in s:
            s = s.rstrip("0").rstrip(".")
        if s in ("0", "-0"):
            s = f"{f:.{max(decimales, 6)}g}"
    return s + ("%" if como == "porcentaje" else "")


def op_resolver(d):
    sp = S()
    ctx = {}
    out = {"valores": {}, "errores": []}
    for nombre, val in (d.get("variables") or {}).items():
        try:
            ctx[nombre] = evaluar(val, ctx)
            out["valores"][nombre] = {"num": float(sp.N(ctx[nombre])), "texto": fmt_num(ctx[nombre], 3)}
        except Exception as ex:
            out["errores"].append(f"variable {nombre}: {ex}")
    for c in d.get("calculos") or []:
        cid = c.get("id")
        try:
            if c.get("resolver"):
                inc = sp.Symbol(c.get("incognita", "x"))
                loc = dict(ctx); loc[str(inc)] = inc
                izq, der = limpiar(c["resolver"]).split("=", 1)
                ec = sp.Eq(evaluar(izq, loc), evaluar(der, loc))
                sols = [s for s in sp.solve(ec, inc) if s.is_real is not False]
                if not sols:
                    raise ValueError("sin solucion real")
                val = sols[0] if len(sols) == 1 else max(sols, key=lambda s: float(s))
                out["valores"][cid] = {
                    "num": float(sp.N(val)), "texto": fmt_num(val, c.get("decimales", 2), c.get("como", "decimal")),
                    "todas": [fmt_num(s, c.get("decimales", 2), c.get("como", "decimal")) for s in sols],
                }
            else:
                val = evaluar(c["calc"], ctx)
                if c.get("final") is not True:
                    # intermedio: se guarda con 6 decimales, se redondea solo el final
                    val = val if getattr(val, "is_Rational", False) else sp.Float(sp.N(val, 20), 20)
                out["valores"][cid] = {
                    "num": float(sp.N(val)),
                    "texto": fmt_num(val, c.get("decimales", 2 if c.get("final") else 3), c.get("como", "decimal")),
                }
            ctx[cid] = val
        except Exception as ex:
            out["errores"].append(f"{cid}: {ex}")
    # verificacion independiente: si no cierra, el video no se publica
    ver = d.get("verificacion")
    out["verificado"] = None
    if ver and ver.get("calc") and ver.get("contra") in ctx:
        try:
            a = float(sp.N(evaluar(ver["calc"], ctx)))
            b = float(sp.N(ctx[ver["contra"]]))
            ok = abs(a - b) <= 1e-6 * max(1.0, abs(a), abs(b))
            out["verificado"] = {"ok": ok, "independiente": a, "pasos": b}
        except Exception as ex:
            out["verificado"] = {"ok": False, "error": str(ex)}
    for g in d.get("graficas") or []:
        try:
            x = sp.Symbol("x")
            loc = dict(ctx); loc["x"] = x
            f = sp.lambdify(x, evaluar(g["funcion"], loc), "math")
            a, b = g.get("x", [-5, 5]); n = int(g.get("n", 80))
            pts = []
            for i in range(n + 1):
                xv = a + (b - a) * i / n
                try:
                    yv = float(f(xv))
                    if yv == yv and abs(yv) < 1e9:
                        pts.append([round(xv, 4), round(yv, 4)])
                except Exception:
                    pass
            out["valores"][g["id"]] = {"puntos": pts}
        except Exception as ex:
            out["errores"].append(f"grafica {g.get('id')}: {ex}")
    return out


# ---------------- voz ----------------
_sem = None


async def una_voz(f, carpeta):
    import edge_tts
    clave = f["key"]
    mp3 = os.path.join(carpeta, clave + ".mp3")
    js = os.path.join(carpeta, clave + ".json")
    if os.path.exists(mp3) and os.path.exists(js):
        with open(js, encoding="utf-8") as fh:
            return clave, json.load(fh)
    async with _sem:
        for intento in range(3):
            try:
                com = edge_tts.Communicate(f["texto"], f.get("voz", "es-MX-JorgeNeural"),
                                           rate=f.get("rate", "+8%"), pitch=f.get("pitch", "+0Hz"),
                                           boundary="WordBoundary")
                audio = bytearray(); palabras = []
                async for ch in com.stream():
                    if ch["type"] == "audio":
                        audio.extend(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        palabras.append({"w": ch["text"], "t": round(ch["offset"] / 1e7, 3),
                                         "d": round(ch["duration"] / 1e7, 3)})
                if not audio:
                    raise RuntimeError("sin audio")
                dur = len(audio) * 8 / 48000  # mp3 CBR 48 kbps
                info = {"audio": clave + ".mp3", "palabras": palabras, "duracion": round(dur, 3)}
                with open(mp3, "wb") as fh:
                    fh.write(audio)
                with open(js, "w", encoding="utf-8") as fh:
                    json.dump(info, fh, ensure_ascii=False)
                return clave, info
            except Exception as ex:
                err = str(ex)
                await asyncio.sleep(0.4 * (intento + 1))
        return clave, {"error": err}


async def op_tts(d):
    carpeta = d["dir"]
    os.makedirs(carpeta, exist_ok=True)
    res = await asyncio.gather(*[una_voz(f, carpeta) for f in d["frases"]])
    return {k: v for k, v in res}


# ---------------- bucle ----------------
def responder(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


async def atender(msg):
    t0 = time.time()
    try:
        op = msg.get("op")
        if op == "resolver":
            r = await asyncio.get_running_loop().run_in_executor(None, op_resolver, msg["data"])
        elif op == "tts":
            r = await op_tts(msg["data"])
        elif op == "ping":
            r = {"pong": True}
        else:
            raise ValueError("op desconocida")
        responder({"id": msg.get("id"), "ok": True, "r": r, "ms": int((time.time() - t0) * 1000)})
    except Exception as ex:
        responder({"id": msg.get("id"), "ok": False, "error": str(ex)})


async def main():
    global _sem
    _sem = asyncio.Semaphore(10)  # la voz se genera de a 10 frases
    loop = asyncio.get_running_loop()
    cola = asyncio.Queue()

    def lector():
        for linea in sys.stdin:
            linea = linea.strip()
            if linea:
                loop.call_soon_threadsafe(cola.put_nowait, linea)
        loop.call_soon_threadsafe(cola.put_nowait, None)

    threading.Thread(target=lector, daemon=True).start()
    responder({"id": "listo", "ok": True})
    while True:
        linea = await cola.get()
        if linea is None:
            break
        try:
            msg = json.loads(linea)
        except Exception:
            continue
        asyncio.create_task(atender(msg))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8")
    asyncio.run(main())
