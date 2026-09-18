import os
import sys

def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def intersect(A, B, C, D):
    # Ignore shared endpoints
    if (abs(A[0]-C[0]) < 1e-4 and abs(A[1]-C[1]) < 1e-4) or \
       (abs(A[0]-D[0]) < 1e-4 and abs(A[1]-D[1]) < 1e-4) or \
       (abs(B[0]-C[0]) < 1e-4 and abs(B[1]-C[1]) < 1e-4) or \
       (abs(B[0]-D[0]) < 1e-4 and abs(B[1]-D[1]) < 1e-4):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_collisions(tracks):
    collisions = {'bot': [], 'top': []}
    for layer in ['bot', 'top']:
        layer_trks = [t for t in tracks if t['layer'] in [layer, 'both']]
        for i in range(len(layer_trks)):
            for j in range(i + 1, len(layer_trks)):
                pts1 = layer_trks[i]['pts']
                pts2 = layer_trks[j]['pts']
                for s1 in range(len(pts1) - 1):
                    for s2 in range(len(pts2) - 1):
                        if intersect(pts1[s1], pts1[s1+1], pts2[s2], pts2[s2+1]):
                            collisions[layer].append((layer_trks[i]['net'], layer_trks[j]['net'], 
                                                      pts1[s1], pts1[s1+1], pts2[s2], pts2[s2+1]))
    return collisions

print("Collision detector ready.")
