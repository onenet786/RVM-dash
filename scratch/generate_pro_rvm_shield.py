"""
=============================================================================
PECODROP RVM — ARDUINO MEGA 2560 EXPANSION SHIELD (REV 3.0 PRO)
Full Professional CAD & PCB Artwork Generator
Strict 1:1 hardware match for RVM_Arduino.ino firmware
=============================================================================
"""

import sys
import os
import math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon
from matplotlib.collections import PatchCollection

# Line intersection checker for strict DRC
def ccw(A, B, C):
    return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

def intersect(A, B, C, D):
    if (A == C or A == D or B == C or B == D):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_track_collisions(tracks, layer_name):
    segments = []
    for trk in tracks:
        if trk['layer'] == layer_name or trk['layer'] == 'both':
            pts = trk['pts']
            for i in range(len(pts) - 1):
                segments.append((pts[i], pts[i+1], trk.get('net', 'unknown')))
    
    collisions = []
    n = len(segments)
    for i in range(n):
        for j in range(i + 1, n):
            s1, s2 = segments[i], segments[j]
            # If segments share a vertex and belong to the same net, they are connected
            if s1[2] == s2[2] and (s1[0] == s2[0] or s1[0] == s2[1] or s1[1] == s2[0] or s1[1] == s2[1]):
                continue
            if intersect(s1[0], s1[1], s2[0], s2[1]):
                collisions.append((s1, s2))
    return collisions

print("Loaded CAD core.")
