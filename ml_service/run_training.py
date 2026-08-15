import asyncio
from main import _auto_train
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

async def run():
    print("Starting ML models training...")
    await _auto_train()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(run())
