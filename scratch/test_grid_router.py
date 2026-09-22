"""
Test A* Grid Router on 160x84 cell grid for Single-Sided PCB.
Grid step = 0.635 mm (25 mil).
Board size = 101.6 mm x 53.34 mm.
"""
import heapq
import numpy as np

GRID_STEP = 0.635
NX = int(101.60 / GRID_STEP) + 1  # 161
NY = int(53.34 / GRID_STEP) + 1   # 85

def to_grid(x, y):
    gx = int(round(x / GRID_STEP))
    gy = int(round(y / GRID_STEP))
    return max(0, min(NX-1, gx)), max(0, min(NY-1, gy))

def to_mm(gx, gy):
    return gx * GRID_STEP, gy * GRID_STEP

print(f"Grid Dimensions: {NX} x {NY} = {NX*NY} cells")
