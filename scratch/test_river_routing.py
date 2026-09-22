
def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def intersect(A, B, C, D):
    if (abs(A[0]-C[0]) < 1e-4 and abs(A[1]-C[1]) < 1e-4) or \
       (abs(A[0]-D[0]) < 1e-4 and abs(A[1]-D[1]) < 1e-4) or \
       (abs(B[0]-C[0]) < 1e-4 and abs(B[1]-C[1]) < 1e-4) or \
       (abs(B[0]-D[0]) < 1e-4 and abs(B[1]-D[1]) < 1e-4):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check(tracks):
    cols = []
    for i in range(len(tracks)):
        for j in range(i+1, len(tracks)):
            p1, p2 = tracks[i]['pts'], tracks[j]['pts']
            for s1 in range(len(p1)-1):
                for s2 in range(len(p2)-1):
                    if intersect(p1[s1], p1[s1+1], p2[s2], p2[s2+1]):
                        cols.append((tracks[i]['net'], tracks[j]['net'], p1[s1], p1[s1+1], p2[s2], p2[s2+1]))
    return cols

print('Checker ready')
