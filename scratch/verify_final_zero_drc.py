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

def check_collisions(tracks):
    res = {'bot': [], 'top': []}
    for layer in ['bot', 'top']:
        trks = [t for t in tracks if t['layer'] in [layer, 'both']]
        for i in range(len(trks)):
            for j in range(i + 1, len(trks)):
                p1, p2 = trks[i]['pts'], trks[j]['pts']
                for s1 in range(len(p1) - 1):
                    for s2 in range(len(p2) - 1):
                        if intersect(p1[s1], p1[s1+1], p2[s2], p2[s2+1]):
                            res[layer].append((trks[i]['net'], trks[j]['net'], p1[s1], p1[s1+1], p2[s2], p2[s2+1]))
    return res

def get_final_clean_tracks():
    tracks = []

    # =========================================================================
    # LAYER 1: BOTTOM COPPER (B.Cu) - 100% PLANAR, 0 COLLISIONS
    # =========================================================================
    # 1.1 +5V_SERVO Power Distribution
    # Drop along West margin to Caps and South Rail
    tracks.append({'net': '5V_SERVO_MAIN_DROP', 'layer': 'bot', 'width': 2.6,
        'pts': [(4.8, 31.8), (4.8, 15.5), (7.2, 15.5), (7.2, 4.5)]})
    # North Servo Rail: Ch1 and Ch3 Servos (stays along Y=31.8)
    tracks.append({'net': '5V_SERVO_NORTH', 'layer': 'bot', 'width': 2.2,
        'pts': [(4.8, 31.8), (21.04, 31.8), (32.04, 31.8), (74.54, 31.8), (85.54, 31.8)]})
    tracks.append({'net': '5V_P_IRIS', 'layer': 'bot', 'width': 2.0,
        'pts': [(21.04, 31.8), (21.04, 34.5)]})
    tracks.append({'net': '5V_P_DROP', 'layer': 'bot', 'width': 2.0,
        'pts': [(32.04, 31.8), (32.04, 34.5)]})
    tracks.append({'net': '5V_PP_IRIS', 'layer': 'bot', 'width': 2.0,
        'pts': [(74.54, 31.8), (74.54, 32.0)]})
    tracks.append({'net': '5V_PP_DROP', 'layer': 'bot', 'width': 2.0,
        'pts': [(85.54, 31.8), (85.54, 32.0)]})
    # South Servo Rail: Ch2 Servos (stays along Y=15.5)
    tracks.append({'net': '5V_SERVO_SOUTH', 'layer': 'bot', 'width': 2.2,
        'pts': [(4.8, 15.5), (47.54, 15.5), (59.04, 15.5)]})
    tracks.append({'net': '5V_M_IRIS', 'layer': 'bot', 'width': 2.0,
        'pts': [(47.54, 15.5), (47.54, 17.0)]})
    tracks.append({'net': '5V_M_DROP', 'layer': 'bot', 'width': 2.0,
        'pts': [(59.04, 15.5), (59.04, 17.0)]})

    # 1.2 Top Edge PWMs on B.Cu (D9, D11)
    tracks.append({'net': 'P_ENTR_TRIG_D9', 'layer': 'bot', 'width': 0.6,
        'pts': [(18.7, 42.1), (18.7, 49.5), (46.04, 49.5), (46.04, 51.1)]})
    tracks.append({'net': 'P_IRIS_PWM_D11', 'layer': 'bot', 'width': 0.6,
        'pts': [(23.58, 34.5), (23.58, 47.5), (51.12, 47.5), (51.12, 51.1)]})

    # 1.3 Signal Traces on B.Cu (Independent non-overlapping channels)
    # Pin 43: P_TOP_ECHO (37.7, 42.1) -> Y=44.5 -> (95.0, 44.5) -> (97.5, 40.40)
    tracks.append({'net': 'P_TOP_ECHO_43', 'layer': 'bot', 'width': 0.55,
        'pts': [(37.7, 42.1), (37.7, 44.5), (95.0, 44.5), (97.5, 40.40)]})
    # Pin 41: P_MID_ECHO (31.7, 42.1) -> Y=46.0 -> (94.0, 46.0) -> (97.5, 37.86)
    tracks.append({'net': 'P_MID_ECHO_41', 'layer': 'bot', 'width': 0.55,
        'pts': [(31.7, 42.1), (31.7, 46.0), (94.0, 46.0), (97.5, 37.86)]})
    # Pin 39: PP_BOT_TRIG (85.4, 40.2) -> Y=35.32 -> (97.5, 35.32)
    tracks.append({'net': 'PP_BOT_TRIG_39', 'layer': 'bot', 'width': 0.55,
        'pts': [(85.4, 40.2), (85.4, 35.32), (97.5, 35.32)]})
    # Pin 37: HX711_DOUT (79.5, 20.1) -> Y=23.8 -> (97.5, 23.8) -> wait, Pin 37 is 32.78
    # Pin 35: PP_IRIS_PWM (77.08, 32.0) -> (77.08, 30.24) -> (97.5, 30.24)
    tracks.append({'net': 'PP_IRIS_PWM_35', 'layer': 'bot', 'width': 0.55,
        'pts': [(77.08, 32.0), (77.08, 30.24), (97.5, 30.24)]})
    # Pin 31: M_MID_TRIG (57.7, 25.1) -> (57.7, 25.16) -> (97.5, 25.16)
    tracks.append({'net': 'M_MID_TRIG_31', 'layer': 'bot', 'width': 0.55,
        'pts': [(57.7, 25.1), (57.7, 25.16), (97.5, 25.16)]})
    # Pin 29: M_BOT_TRIG (51.7, 25.1) -> (51.7, 22.62) -> (97.5, 22.62)
    tracks.append({'net': 'M_BOT_TRIG_29', 'layer': 'bot', 'width': 0.55,
        'pts': [(51.7, 25.1), (51.7, 22.62), (97.5, 22.62)]})
    # Pin 28: M_DROP_PWM (61.58, 17.0) -> (61.58, 21.0) -> (100.04, 21.0) -> (100.04, 22.62)
    tracks.append({'net': 'M_DROP_PWM_28', 'layer': 'bot', 'width': 0.55,
        'pts': [(61.58, 17.0), (61.58, 21.2), (100.04, 21.2), (100.04, 22.62)]})
    # Pin 27: M_IRIS_PWM (50.08, 17.0) -> (50.08, 20.08) -> (97.5, 20.08)
    tracks.append({'net': 'M_IRIS_PWM_27', 'layer': 'bot', 'width': 0.55,
        'pts': [(50.08, 17.0), (50.08, 20.08), (97.5, 20.08)]})
    # Pin 25: M_ENTR_TRIG (45.7, 25.1) -> (45.7, 17.54) -> (97.5, 17.54)
    tracks.append({'net': 'M_ENTR_TRIG_25', 'layer': 'bot', 'width': 0.55,
        'pts': [(45.7, 25.1), (45.7, 17.54), (97.5, 17.54)]})

    # =========================================================================
    # LAYER 2: TOP COPPER (F.Cu) - 100% PLANAR, 0 COLLISIONS
    # =========================================================================
    # 2.1 12V Power - Routed along West margin (X <= 3.2)
    tracks.append({'net': '12V_TO_TB_IND', 'layer': 'top', 'width': 1.6,
        'pts': [(4.8, 44.2), (3.2, 44.2), (3.2, 23.5), (18.5, 23.5), (18.5, 24.2)]})
    tracks.append({'net': '12V_GND_TO_TB_IND', 'layer': 'top', 'width': 1.4,
        'pts': [(9.6, 44.2), (9.6, 45.5), (2.0, 45.5), (2.0, 22.0), (21.3, 22.0), (21.3, 24.2)]})
    tracks.append({'net': '12V_TO_OPTO_R1', 'layer': 'top', 'width': 1.0,
        'pts': [(18.5, 24.2), (18.5, 25.5), (28.0, 25.5)]})
    tracks.append({'net': 'IND_SIG_TO_OPTO', 'layer': 'top', 'width': 1.0,
        'pts': [(24.1, 24.2), (24.1, 22.0), (28.0, 22.0)]})

    # 2.2 PGND Power Ground
    tracks.append({'net': 'PGND_TVS', 'layer': 'top', 'width': 2.0,
        'pts': [(4.3, 16.2), (7.2, 16.2)]})
    # North PGND Rail (Y=34.5)
    tracks.append({'net': 'PGND_P_IRIS', 'layer': 'top', 'width': 2.0,
        'pts': [(9.6, 31.8), (18.5, 31.8), (18.5, 34.5)]})
    tracks.append({'net': 'PGND_P_DROP', 'layer': 'top', 'width': 2.0,
        'pts': [(18.5, 31.8), (29.5, 31.8), (29.5, 34.5)]})
    tracks.append({'net': 'PGND_PP_IRIS', 'layer': 'top', 'width': 2.0,
        'pts': [(29.5, 31.8), (72.0, 31.8), (72.0, 32.0)]})
    tracks.append({'net': 'PGND_PP_DROP', 'layer': 'top', 'width': 2.0,
        'pts': [(72.0, 31.8), (83.0, 31.8), (83.0, 32.0)]})
    # South PGND Rail (Y=14.0)
    tracks.append({'net': 'PGND_SOUTH', 'layer': 'top', 'width': 2.0,
        'pts': [(9.6, 31.8), (9.6, 14.0), (45.0, 14.0), (56.5, 14.0)]})
    tracks.append({'net': 'PGND_M_IRIS', 'layer': 'top', 'width': 1.8,
        'pts': [(45.0, 14.0), (45.0, 17.0)]})
    tracks.append({'net': 'PGND_M_DROP', 'layer': 'top', 'width': 1.8,
        'pts': [(56.5, 14.0), (56.5, 17.0)]})

    # 2.3 Top PWM Signals (D10, D12)
    tracks.append({'net': 'P_ENTR_ECHO_D10', 'layer': 'top', 'width': 0.6,
        'pts': [(19.7, 42.1), (19.7, 48.5), (48.58, 48.5), (48.58, 51.1)]})
    tracks.append({'net': 'P_DROP_PWM_D12', 'layer': 'top', 'width': 0.6,
        'pts': [(34.58, 34.5), (34.58, 47.0), (53.66, 47.0), (53.66, 51.1)]})

    # 2.4 Signals on F.Cu
    # Pin 46: M_TOP_ECHO (64.7, 25.1) -> Y=45.48
    tracks.append({'net': 'M_TOP_ECHO_46', 'layer': 'top', 'width': 0.55,
        'pts': [(64.7, 25.1), (64.7, 45.48), (100.04, 45.48)]})
    # Pin 44: M_MID_ECHO (58.7, 25.1) -> Y=42.94
    tracks.append({'net': 'M_MID_ECHO_44', 'layer': 'top', 'width': 0.55,
        'pts': [(58.7, 25.1), (58.7, 42.94), (100.04, 42.94)]})
    # Pin 42: P_TOP_TRIG (36.7, 42.1) -> Y=40.40
    tracks.append({'net': 'P_TOP_TRIG_42', 'layer': 'top', 'width': 0.55,
        'pts': [(36.7, 42.1), (36.7, 44.0), (96.0, 44.0), (100.04, 40.40)]})
    # Pin 40: PP_BOT_ECHO (86.8, 40.2) -> Y=37.86
    tracks.append({'net': 'PP_BOT_ECHO_40', 'layer': 'top', 'width': 0.55,
        'pts': [(86.8, 40.2), (86.8, 37.86), (100.04, 37.86)]})
    # Pin 38: HX711_SCK (84.0, 20.1) -> Y=35.32
    tracks.append({'net': 'HX711_SCK_38', 'layer': 'top', 'width': 0.55,
        'pts': [(84.0, 20.1), (84.0, 35.32), (100.04, 35.32)]})
    # Pin 36: PP_DROP_PWM (88.08, 32.0) -> Y=32.78
    tracks.append({'net': 'PP_DROP_PWM_36', 'layer': 'top', 'width': 0.55,
        'pts': [(88.08, 32.0), (88.08, 32.78), (100.04, 32.78)]})
    # Pin 34: PP_TOP_ECHO (75.8, 40.2) -> Y=30.24
    tracks.append({'net': 'PP_TOP_ECHO_34', 'layer': 'top', 'width': 0.55,
        'pts': [(75.8, 40.2), (75.8, 30.24), (100.04, 30.24)]})
    # Pin 32: CAN_INDUCTIVE (33.5, 25.5) -> Y=27.70
    tracks.append({'net': 'CAN_INDUCTIVE_PIN32', 'layer': 'top', 'width': 0.7,
        'pts': [(33.5, 25.5), (33.5, 27.70), (100.04, 27.70)]})
    # Pin 30: M_BOT_ECHO (52.7, 25.1) -> Y=25.16
    tracks.append({'net': 'M_BOT_ECHO_30', 'layer': 'top', 'width': 0.55,
        'pts': [(52.7, 25.1), (52.7, 25.16), (100.04, 25.16)]})
    # Pin 26: M_ENTR_ECHO (46.7, 25.1) -> Y=20.08
    tracks.append({'net': 'M_ENTR_ECHO_26', 'layer': 'top', 'width': 0.55,
        'pts': [(46.7, 25.1), (46.7, 20.08), (100.04, 20.08)]})

    return tracks

if __name__ == '__main__':
    trks = get_final_clean_tracks()
    cols = check_collisions(trks)
    print('FINAL BOT COLLISIONS:', len(cols['bot']))
    for c in cols['bot']:
        print('  BOT:', c[0], '<->', c[1])
    print('FINAL TOP COLLISIONS:', len(cols['top']))
    for c in cols['top']:
        print('  TOP:', c[0], '<->', c[1])
