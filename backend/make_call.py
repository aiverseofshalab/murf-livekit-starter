"""Root convenience entrypoint delegating to src/make_call.py."""
import asyncio
import importlib.util
import sys
from pathlib import Path

src_make_call = Path(__file__).parent / "src" / "make_call.py"
spec = importlib.util.spec_from_file_location("src_make_call_module", src_make_call)
module = importlib.util.module_from_spec(spec)
sys.modules["src_make_call_module"] = module
spec.loader.exec_module(module)

if __name__ == "__main__":
    raise SystemExit(asyncio.run(module.main()))
