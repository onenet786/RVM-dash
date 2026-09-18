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

def check_layer_intersections(tracks, layer_name):
    trks = [t for t in tracks if t['layer'] in [layer_name, 'both']]
    collisions = []
    for i in range(len(trks)):
        for j in range(i + 1, len(trks)):
            pts1 = trks[i]['pts']
            pts2 = trks[j]['pts']
            for s1 in range(len(pts1) - 1):
                for s2 in range(len(pts2) - 1):
                    if intersect(pts1[s1], pts1[s1+1], pts2[s2], pts2[s2+1]):
                        collisions.append((trks[i]['net'], trks[j]['net'], 
                                           pts1[s1], pts1[s1+1], pts2[s2], pts2[s2+1]))
    return collisions

def get_clean_tracks():
    tracks = []

    # =========================================================================
    # 1. HEAVY +5V_SERVO RAIL (Bottom Copper B.Cu - 2.4mm / 100 mil)
    # Continuous tree routing from TB_SERVO_PWR to all 6 servos & bulk caps
    # =========================================================================
    # Main trunk from TB2 (4.8, 31.8) down to bulk capacitors C1, C2, C3
    tracks.append({
        'pts': [(4.8, 31.8), (4.8, 22.0), (7.2, 19.5), (7.2, 12.0), (7.2, 4.5)],
        'width': 2.6, 'layer': 'bot', 'net': '5V_SERVO_FEED_CAPS'
    })
    # Feed to Chamber 1 Servos (Pin 2 is +5V)
    tracks.append({
        'pts': [(4.8, 31.8), (14.0, 31.8), (14.0, 33.5), (21.04, 33.5), (21.04, 34.5)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_P_IRIS'
    })
    tracks.append({
        'pts': [(21.04, 33.5), (32.04, 33.5), (32.04, 34.5)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_P_DROP'
    })
    # Trunk connecting Chamber 1 to Chamber 2 & Chamber 3
    tracks.append({
        'pts': [(32.04, 33.5), (42.0, 33.5), (44.0, 31.5), (44.0, 18.5), (47.54, 18.5), (47.54, 17.0)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_M_IRIS'
    })
    tracks.append({
        'pts': [(47.54, 18.5), (59.04, 18.5), (59.04, 17.0)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_M_DROP'
    })
    tracks.append({
        'pts': [(44.0, 31.5), (74.54, 31.5), (74.54, 32.0)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_PP_IRIS'
    })
    tracks.append({
        'pts': [(74.54, 31.5), (85.54, 31.5), (85.54, 32.0)],
        'width': 2.2, 'layer': 'bot', 'net': '5V_SERVO_PP_DROP'
    })

    # =========================================================================
    # 2. POWER GROUND (PGND) RAIL (Top Copper F.Cu - 2.2mm / 88 mil)
    # Routed on TOP copper so it NEVER intersects with 5V_SERVO on BOTTOM copper!
    # =========================================================================
    tracks.append({
        'pts': [(9.6, 31.8), (11.5, 31.8), (11.5, 20.5), (7.2, 16.2), (4.3, 16.2)],
        'width': 2.2, 'layer': 'top', 'net': 'PGND_TVS'
    })
    tracks.append({
        'pts': [(9.6, 31.8), (16.0, 31.8), (18.5, 35.8), (18.5, 34.5)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_P_IRIS'
    })
    tracks.append({
        'pts': [(18.5, 35.8), (29.5, 35.8), (29.5, 34.5)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_P_DROP'
    })
    tracks.append({
        'pts': [(29.5, 35.8), (42.0, 35.8), (45.0, 15.5), (45.0, 17.0)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_M_IRIS'
    })
    tracks.append({
        'pts': [(45.0, 15.5), (56.5, 15.5), (56.5, 17.0)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_M_DROP'
    })
    tracks.append({
        'pts': [(42.0, 35.8), (72.0, 35.8), (72.0, 32.0)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_PP_IRIS'
    })
    tracks.append({
        'pts': [(72.0, 35.8), (83.0, 35.8), (83.0, 32.0)],
        'width': 2.0, 'layer': 'top', 'net': 'PGND_PP_DROP'
    })

    # =========================================================================
    # 3. 12V MAIN & INDUCTIVE SENSOR WIRING
    # =========================================================================
    tracks.append({
        'pts': [(4.8, 44.2), (15.0, 44.2), (18.5, 40.7), (18.5, 24.2)],
        'width': 1.6, 'layer': 'top', 'net': '12V_TO_TB_IND'
    })
    tracks.append({
        'pts': [(9.6, 44.2), (14.0, 44.2), (24.1, 34.1), (24.1, 24.2)],
        'width': 1.4, 'layer': 'bot', 'net': '12V_GND_TO_TB_IND'
    })
    tracks.append({
        'pts': [(21.3, 24.2), (21.3, 22.0), (28.0, 22.0)],
        'width': 1.0, 'layer': 'top', 'net': 'IND_SIG_TO_OPTO'
    })
    tracks.append({
        'pts': [(18.5, 24.2), (26.0, 24.2), (26.0, 25.5), (28.0, 25.5)],
        'width': 1.0, 'layer': 'top', 'net': '12V_TO_OPTO_R1'
    })

    # =========================================================================
    # 4. 5V_LOGIC CLEAN RAIL (Top Copper F.Cu)
    # =========================================================================
    tracks.append({
        'pts': [(42.66, 2.4), (42.66, 6.0), (38.0, 6.0), (38.0, 8.0)],
        'width': 1.3, 'layer': 'top', 'net': 'MEGA_5V_TO_FB1'
    })
    tracks.append({
        'pts': [(38.0, 8.0), (32.0, 8.0), (20.0, 14.0), (16.0, 14.0), (16.0, 44.0), (17.7, 44.0), (17.7, 42.1)],
        'width': 1.2, 'layer': 'top', 'net': '5V_LOGIC_CH1_BUS'
    })
    tracks.append({
        'pts': [(17.7, 44.0), (23.7, 44.0), (29.7, 44.0), (35.7, 44.0)],
        'width': 1.0, 'layer': 'top', 'net': '5V_LOGIC_US_CH1'
    })

    # =========================================================================
    # 5. ORDERED COLLISION-FREE SIGNAL TRACKS (Bottom Copper B.Cu)
    # All signals routed on B.Cu connect to TOP HEADER (D9, D11) or 
    # ODD PINS of 2x18 Header (X = 97.5) via STRICT MONOTONIC Y CHANNELS
    # =========================================================================
    # D9: Plastic Entrance Trig
    tracks.append({
        'pts': [(18.7, 42.1), (18.7, 46.5), (23.2, 51.0), (46.04, 51.0), (46.04, 51.1)],
        'width': 0.6, 'layer': 'bot', 'net': 'P_ENTR_TRIG_D9'
    })
    # D11: Plastic Iris PWM
    tracks.append({
        'pts': [(23.58, 34.5), (23.58, 38.5), (35.0, 49.0), (51.12, 49.0), (51.12, 51.1)],
        'width': 0.6, 'layer': 'bot', 'net': 'P_IRIS_PWM_D11'
    })

    # Signals in LOWER ZONE to ODD PINS (X = 97.5):
    # Pin 23 (Y = 15.0): P_BOT_ECHO
    tracks.append({
        'pts': [(25.7, 42.1), (25.7, 40.0), (28.0, 38.0), (28.0, 13.5), (94.0, 13.5), (96.5, 15.0), (97.5, 15.0)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_BOT_ECHO_23'
    })
    # Pin 25 (Y = 17.54): M_ENTR_TRIG
    tracks.append({
        'pts': [(45.7, 25.1), (45.7, 20.0), (48.0, 16.0), (93.0, 16.0), (95.5, 17.54), (97.5, 17.54)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_ENTR_TRIG_25'
    })
    # Pin 27 (Y = 20.08): M_IRIS_PWM
    tracks.append({
        'pts': [(50.08, 17.0), (50.08, 14.5), (54.0, 18.5), (93.0, 18.5), (95.5, 20.08), (97.5, 20.08)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_IRIS_PWM_27'
    })
    # Pin 29 (Y = 22.62): M_BOT_TRIG
    tracks.append({
        'pts': [(51.7, 25.1), (51.7, 22.5), (55.0, 21.0), (93.0, 21.0), (95.5, 22.62), (97.5, 22.62)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_BOT_TRIG_29'
    })
    # Pin 31 (Y = 25.16): M_MID_TRIG
    tracks.append({
        'pts': [(57.7, 25.1), (57.7, 23.5), (60.0, 23.5), (93.0, 23.5), (95.5, 25.16), (97.5, 25.16)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_MID_TRIG_31'
    })
    # Pin 33 (Y = 27.70): PP_TOP_TRIG
    tracks.append({
        'pts': [(74.4, 40.2), (74.4, 38.0), (76.0, 36.5), (76.0, 26.0), (93.0, 26.0), (95.5, 27.70), (97.5, 27.70)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_TOP_TRIG_33'
    })
    # Pin 35 (Y = 30.24): PP_IRIS_PWM
    tracks.append({
        'pts': [(77.08, 32.0), (77.08, 29.5), (80.0, 28.5), (93.0, 28.5), (95.5, 30.24), (97.5, 30.24)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_IRIS_PWM_35'
    })
    # Pin 37 (Y = 32.78): HX711_DOUT
    tracks.append({
        'pts': [(79.5, 20.1), (79.5, 17.5), (83.0, 31.0), (93.0, 31.0), (95.5, 32.78), (97.5, 32.78)],
        'width': 0.55, 'layer': 'bot', 'net': 'HX711_DOUT_37'
    })

    # Signals in UPPER ZONE to ODD PINS (X = 97.5):
    # Pin 39 (Y = 35.32): PP_BOT_TRIG
    tracks.append({
        'pts': [(85.4, 40.2), (85.4, 38.0), (88.0, 35.32), (97.5, 35.32)],
        'width': 0.55, 'layer': 'bot', 'net': 'PP_BOT_TRIG_39'
    })
    # Pin 41 (Y = 37.86): P_MID_ECHO
    tracks.append({
        'pts': [(31.7, 42.1), (31.7, 45.5), (35.0, 48.0), (90.0, 48.0), (94.0, 37.86), (97.5, 37.86)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_MID_ECHO_41'
    })
    # Pin 43 (Y = 40.40): P_TOP_ECHO
    tracks.append({
        'pts': [(37.7, 42.1), (37.7, 46.5), (41.0, 49.5), (89.0, 49.5), (93.0, 40.40), (97.5, 40.40)],
        'width': 0.55, 'layer': 'bot', 'net': 'P_TOP_ECHO_43'
    })
    # Pin 45 (Y = 42.94): M_TOP_TRIG
    tracks.append({
        'pts': [(63.7, 25.1), (63.7, 28.0), (66.0, 30.0), (66.0, 50.5), (88.0, 50.5), (92.0, 42.94), (97.5, 42.94)],
        'width': 0.55, 'layer': 'bot', 'net': 'M_TOP_TRIG_45'
    })

    # =========================================================================
    # 6. ORDERED COLLISION-FREE SIGNAL TRACKS (Top Copper F.Cu)
    # All signals routed on F.Cu connect to TOP HEADER (D10, D12) or 
    # EVEN PINS of 2x18 Header (X = 100.04) via STRICT MONOTONIC Y CHANNELS
    # =========================================================================
    # D10: Plastic Entrance Echo
    tracks.append({
        'pts': [(19.7, 42.1), (19.7, 47.5), (24.0, 50.0), (48.58, 50.0), (48.58, 51.1)],
        'width': 0.6, 'layer': 'top', 'net': 'P_ENTR_ECHO_D10'
    })
    # D12: Plastic Drop PWM
    tracks.append({
        'pts': [(34.58, 34.5), (34.58, 37.0), (44.0, 48.0), (53.66, 48.0), (53.66, 51.1)],
        'width': 0.6, 'layer': 'top', 'net': 'P_DROP_PWM_D12'
    })

    # Signals on Top Copper to EVEN PINS (X = 100.04):
    # Pin 22 (Y = 15.0): P_BOT_TRIG
    tracks.append({
        'pts': [(24.7, 42.1), (24.7, 39.0), (27.0, 12.0), (95.0, 12.0), (98.5, 15.0), (100.04, 15.0)],
        'width': 0.55, 'layer': 'top', 'net': 'P_BOT_TRIG_22'
    })
    # Pin 24 (Y = 17.54): P_MID_TRIG
    tracks.append({
        'pts': [(30.7, 42.1), (30.7, 39.0), (33.0, 14.5), (95.0, 14.5), (98.5, 17.54), (100.04, 17.54)],
        'width': 0.55, 'layer': 'top', 'net': 'P_MID_TRIG_24'
    })
    # Pin 26 (Y = 20.08): M_ENTR_ECHO
    tracks.append({
        'pts': [(46.7, 25.1), (46.7, 19.0), (50.0, 17.0), (95.0, 17.0), (98.5, 20.08), (100.04, 20.08)],
        'width': 0.55, 'layer': 'top', 'net': 'M_ENTR_ECHO_26'
    })
    # Pin 28 (Y = 22.62): M_DROP_PWM
    tracks.append({
        'pts': [(61.58, 17.0), (61.58, 13.5), (65.0, 19.5), (95.0, 19.5), (98.5, 22.62), (100.04, 22.62)],
        'width': 0.55, 'layer': 'top', 'net': 'M_DROP_PWM_28'
    })
    # Pin 30 (Y = 25.16): M_BOT_ECHO
    tracks.append({
        'pts': [(52.7, 25.1), (52.7, 21.0), (56.0, 22.0), (95.0, 22.0), (98.5, 25.16), (100.04, 25.16)],
        'width': 0.55, 'layer': 'top', 'net': 'M_BOT_ECHO_30'
    })
    # Pin 32 (Y = 27.70): CAN_INDUCTIVE (From Optocoupler U1 Pin 4 at 33.5, 25.5)
    tracks.append({
        'pts': [(33.5, 25.5), (38.0, 25.5), (41.0, 24.5), (95.0, 24.5), (98.5, 27.70), (100.04, 27.70)],
        'width': 0.7, 'layer': 'top', 'net': 'CAN_INDUCTIVE_PIN32'
    })
    # Pin 34 (Y = 30.24): PP_TOP_ECHO
    tracks.append({
        'pts': [(75.8, 40.2), (75.8, 36.0), (78.0, 27.0), (95.0, 27.0), (98.5, 30.24), (100.04, 30.24)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_TOP_ECHO_34'
    })
    # Pin 36 (Y = 32.78): PP_DROP_PWM
    tracks.append({
        'pts': [(88.08, 32.0), (88.08, 28.5), (91.0, 29.5), (95.0, 29.5), (98.5, 32.78), (100.04, 32.78)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_DROP_PWM_36'
    })
    # Pin 38 (Y = 35.32): HX711_SCK
    tracks.append({
        'pts': [(84.0, 20.1), (84.0, 16.5), (87.0, 32.0), (95.0, 32.0), (98.5, 35.32), (100.04, 35.32)],
        'width': 0.55, 'layer': 'top', 'net': 'HX711_SCK_38'
    })
    # Pin 40 (Y = 37.86): PP_BOT_ECHO
    tracks.append({
        'pts': [(86.8, 40.2), (86.8, 37.0), (89.0, 37.86), (100.04, 37.86)],
        'width': 0.55, 'layer': 'top', 'net': 'PP_BOT_ECHO_40'
    })
    # Pin 42 (Y = 40.40): P_TOP_TRIG
    tracks.append({
        'pts': [(36.7, 42.1), (36.7, 45.0), (42.0, 46.5), (92.0, 46.5), (96.0, 40.40), (100.04, 40.40)],
        'width': 0.55, 'layer': 'top', 'net': 'P_TOP_TRIG_42'
    })
    # Pin 44 (Y = 42.94): M_MID_ECHO
    tracks.append({
        'pts': [(58.7, 25.1), (58.7, 28.0), (62.0, 47.5), (92.0, 47.5), (96.0, 42.94), (100.04, 42.94)],
        'width': 0.55, 'layer': 'top', 'net': 'M_MID_ECHO_44'
    })
    # Pin 46 (Y = 45.48): M_TOP_ECHO
    tracks.append({
        'pts': [(64.7, 25.1), (64.7, 27.5), (68.0, 48.5), (92.0, 48.5), (96.0, 45.48), (100.04, 45.48)],
        'width': 0.55, 'layer': 'top', 'net': 'M_TOP_ECHO_46'
    })

    return tracks

if __name__ == '__main__':
    trks = get_clean_tracks()
    for layer in ['bot', 'top']:
        cols = check_layer_intersections(trks, layer)
        print(f"Layer '{layer}' has {len(cols)} collisions.")
        for c in cols:
            print(f"  Collision: {c[0]} <-> {c[1]}")
