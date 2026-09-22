import sys

def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def intersect(A, B, C, D):
    if (abs(A[0]-C[0]) < 1e-4 and abs(A[1]-C[1]) < 1e-4) or \
       (abs(A[0]-D[0]) < 1e-4 and abs(A[1]-D[1]) < 1e-4) or \
       (abs(B[0]-C[0]) < 1e-4 and abs(B[1]-C[1]) < 1e-4) or \
       (abs(B[0]-D[0]) < 1e-4 and abs(B[1]-D[1]) < 1e-4):
        return False
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

def check_layer(tracks, layer_name):
    trks = [t for t in tracks if t['layer'] in [layer_name, 'both']]
    cols = []
    for i in range(len(trks)):
        for j in range(i + 1, len(trks)):
            p1, p2 = trks[i]['pts'], trks[j]['pts']
            for s1 in range(len(p1) - 1):
                for s2 in range(len(p2) - 1):
                    if intersect(p1[s1], p1[s1+1], p2[s2], p2[s2+1]):
                        cols.append((trks[i]['net'], trks[j]['net'], p1[s1], p1[s1+1], p2[s2], p2[s2+1]))
    return cols

def solve():
    tracks = []
    
    # =========================================================================
    # BOTTOM LAYER (B.Cu)
    # =========================================================================
    
    # 1. 5V_SERVO Power Rail (Bottom)
    tracks.append({'net': '5V_SERVO_FEED', 'layer': 'bot', 'width': 2.6,
        'pts': [(4.8, 31.8), (4.8, 20.0), (7.2, 19.5), (7.2, 4.5)]})
    tracks.append({'net': '5V_SERVO_P_IRIS', 'layer': 'bot', 'width': 2.2,
        'pts': [(4.8, 31.8), (21.04, 31.8), (21.04, 34.5)]})
    tracks.append({'net': '5V_SERVO_P_DROP', 'layer': 'bot', 'width': 2.2,
        'pts': [(21.04, 31.8), (32.04, 31.8), (32.04, 34.5)]})
    tracks.append({'net': '5V_SERVO_CH2_DROP', 'layer': 'bot', 'width': 2.2,
        'pts': [(32.04, 31.8), (41.0, 31.8), (41.0, 18.5), (47.54, 18.5), (47.54, 17.0)]})
    tracks.append({'net': '5V_SERVO_M_DROP', 'layer': 'bot', 'width': 2.2,
        'pts': [(47.54, 18.5), (59.04, 18.5), (59.04, 17.0)]})
    tracks.append({'net': '5V_SERVO_PP_IRIS', 'layer': 'bot', 'width': 2.2,
        'pts': [(41.0, 31.8), (74.54, 31.8), (74.54, 32.0)]})
    tracks.append({'net': '5V_SERVO_PP_DROP', 'layer': 'bot', 'width': 2.2,
        'pts': [(74.54, 31.8), (85.54, 31.8), (85.54, 32.0)]})

    # 2. Digital PWMs (D9, D11)
    tracks.append({'net': 'P_ENTR_TRIG_D9', 'layer': 'bot', 'width': 0.6,
        'pts': [(18.7, 42.1), (18.7, 49.0), (46.04, 49.0), (46.04, 51.1)]})
    tracks.append({'net': 'P_IRIS_PWM_D11', 'layer': 'bot', 'width': 0.6,
        'pts': [(23.58, 34.5), (23.58, 47.0), (51.12, 47.0), (51.12, 51.1)]})

    # 3. North Signals to Inner Row (43, 41)
    # P_TOP_ECHO_43 (37.7, 42.1) -> Y=45.0 -> (94.0, 45.0) -> (97.5, 40.40)
    tracks.append({'net': 'P_TOP_ECHO_43', 'layer': 'bot', 'width': 0.55,
        'pts': [(37.7, 42.1), (37.7, 45.0), (94.0, 45.0), (97.5, 40.40)]})
    # P_MID_ECHO_41 (31.7, 42.1) -> Y=43.5 -> (93.0, 43.5) -> (97.5, 37.86)
    tracks.append({'net': 'P_MID_ECHO_41', 'layer': 'bot', 'width': 0.55,
        'pts': [(31.7, 42.1), (31.7, 43.5), (93.0, 43.5), (97.5, 37.86)]})

    # 4. PP_BOT_TRIG_39 (85.4, 40.2) -> (85.4, 35.32) -> (97.5, 35.32)
    tracks.append({'net': 'PP_BOT_TRIG_39', 'layer': 'bot', 'width': 0.55,
        'pts': [(85.4, 40.2), (85.4, 35.32), (97.5, 35.32)]})

    # 5. Chamber 2 Signals (25, 27, 29, 31, 45)
    # M_TOP_TRIG_45 (63.7, 25.1) -> (63.7, 23.0) -> (66.0, 23.0) -> (66.0, 11.0) -> (95.0, 11.0) -> wait!
    # Where can M_TOP_TRIG go? Pin 45 is at Y=42.94!
    # Can it rise up at X=65.0? (63.7, 25.1) -> (63.7, 30.0) -> (68.0, 30.0) -> (68.0, 46.5) -> (95.0, 46.5) -> (97.5, 42.94)
    # Notice: at Y=46.5 it is ABOVE 45.0 (P_TOP_ECHO_43)! So it does NOT cross 43 or 41!
    tracks.append({'net': 'M_TOP_TRIG_45', 'layer': 'bot', 'width': 0.55,
        'pts': [(63.7, 25.1), (63.7, 29.5), (68.0, 29.5), (68.0, 46.5), (95.0, 46.5), (97.5, 42.94)]})

    # M_MID_TRIG_31 (57.7, 25.1) -> (57.7, 25.16) -> (97.5, 25.16)
    # Wait, between X=57.7 and 97.5, does it cross 5V_SERVO?
    # 5V_SERVO is at Y=31.8 and Y=18.5!
    # At Y=25.16, it is ABOVE 18.5 and BELOW 31.8! So it NEVER crosses 5V_SERVO!
    tracks.append({'net': 'M_MID_TRIG_31', 'layer': 'bot', 'width': 0.55,
        'pts': [(57.7, 25.1), (57.7, 25.16), (97.5, 25.16)]})

    # M_BOT_TRIG_29 (51.7, 25.1) -> (51.7, 22.62) -> (97.5, 22.62)
    # Y=22.62 is also between 18.5 and 31.8!
    tracks.append({'net': 'M_BOT_TRIG_29', 'layer': 'bot', 'width': 0.55,
        'pts': [(51.7, 25.1), (51.7, 22.62), (97.5, 22.62)]})

    # M_IRIS_PWM_27 (50.08, 17.0) -> Y=15.0 -> (92.0, 15.0) -> (94.5, 20.08) -> (97.5, 20.08)
    tracks.append({'net': 'M_IRIS_PWM_27', 'layer': 'bot', 'width': 0.55,
        'pts': [(50.08, 17.0), (50.08, 15.0), (92.0, 15.0), (94.5, 20.08), (97.5, 20.08)]})

    # M_ENTR_TRIG_25 (45.7, 25.1) -> (45.7, 13.5) -> (93.0, 13.5) -> (95.5, 17.54) -> (97.5, 17.54)
    # Wait! At X=45.7, going down to Y=13.5 crosses 5V_SERVO (which is at Y=18.5 between 42.0 and 59.04)!
    # How to avoid crossing 5V_SERVO at 18.5?
    # Stay ABOVE 18.5! Route at Y=20.5!
    # (45.7, 25.1) -> (45.7, 20.5) -> (48.0, 20.5) -> wait, Pin 25 is at Y=17.54.
    # Can it go to Y=17.54 AFTER X=59.04 (where 5V_SERVO ends)?
    # YES! At X=61.0, 5V_SERVO has already dropped to the servos!
    # So from X=61.0 it can drop to Y=17.54!
    tracks.append({'net': 'M_ENTR_TRIG_25', 'layer': 'bot', 'width': 0.55,
        'pts': [(45.7, 25.1), (45.7, 21.0), (62.0, 21.0), (62.0, 17.54), (97.5, 17.54)]})

    # 6. Remaining Odd Pins (33, 35, 37)
    # PP_TOP_TRIG_33 (74.4, 40.2) -> Y=38.0 -> (88.0, 38.0) -> (88.0, 27.70) -> (97.5, 27.70)
    # Wait, at X=88.0, Y=31.8 is 5V_SERVO!
    # Can it drop at X=90.0 (past 85.54 where 5V_SERVO ends)?
    # YES! At X=90.0, 5V_SERVO is ALREADY FINISHED!
    tracks.append({'net': 'PP_TOP_TRIG_33', 'layer': 'bot', 'width': 0.55,
        'pts': [(74.4, 40.2), (74.4, 38.0), (90.0, 38.0), (90.0, 27.70), (97.5, 27.70)]})

    # PP_IRIS_PWM_35 (77.08, 32.0) -> Pin 35 is at (97.5, 30.24)
    # Source is at Y=32.0, dest is at Y=30.24.
    # It can go (77.08, 32.0) -> (77.08, 30.24) -> (97.5, 30.24)!
    # Wait, 5V_SERVO is at Y=31.8 between 74.54 and 85.54!
    # So if it drops at X=77.08 from 32.0 to 30.24, it crosses 31.8!
    # To avoid crossing, exit at Y=33.5 (above 31.8) -> run across to X=88.0 (past 85.54) -> drop to 30.24!
    tracks.append({'net': 'PP_IRIS_PWM_35', 'layer': 'bot', 'width': 0.55,
        'pts': [(77.08, 32.0), (77.08, 33.5), (88.0, 33.5), (88.0, 30.24), (97.5, 30.24)]})

    # HX711_DOUT_37 (79.5, 20.1) -> Pin 37 is at (97.5, 32.78)
    # Source is at Y=20.1. Can it run at Y=20.1 to X=89.0, then rise to 32.78?
    # At X=89.0, Y=31.8 is past 85.54!
    tracks.append({'net': 'HX711_DOUT_37', 'layer': 'bot', 'width': 0.55,
        'pts': [(79.5, 20.1), (89.0, 20.1), (89.0, 32.78), (97.5, 32.78)]})

    return tracks

if __name__ == '__main__':
    trks = solve()
    cols = check_layer(trks, 'bot')
    print(f'Layer bot collisions: {len(cols)}')
    for c in cols:
        print(f'  {c[0]} <-> {c[1]}: {c[2]}->{c[3]} x {c[4]}->{c[5]}')
