import sys, os
sys.path.append(os.path.dirname(__file__))
import test_full_zero_collisions as tf

def test_full_set():
    tracks = tf.get_complete_board_tracks()
    
    # 1. Chamber 1 Remaining Signals (Plastic: 22, 23, 24, 42, 43)
    # Sources:
    # P_BOT_TRIG (Pin 22, Dest: 100.04, 15.00) <- (24.7, 42.1)
    # P_BOT_ECHO (Pin 23, Dest: 97.5, 15.00) <- (25.7, 42.1)
    # P_MID_TRIG (Pin 24, Dest: 100.04, 17.54) <- (30.7, 42.1)
    # P_TOP_TRIG (Pin 42, Dest: 100.04, 40.40) <- (36.7, 42.1)
    # P_TOP_ECHO (Pin 43, Dest: 97.5, 40.40) <- (37.7, 42.1)
    
    # Notice: Pins 42 and 43 are at Y=40.40.
    tracks.append({'net': 'P_TOP_TRIG_42', 'layer': 'top', 'width': 0.55,
        'pts': [(36.7, 42.1), (36.7, 44.0), (96.0, 44.0), (100.04, 40.40)]})
    tracks.append({'net': 'P_TOP_ECHO_43', 'layer': 'bot', 'width': 0.55,
        'pts': [(37.7, 42.1), (37.7, 44.0), (95.0, 44.0), (97.5, 40.40)]})
        
    # 2. Inductive Optocoupler Output: Pin 32 (Dest: 100.04, 27.70) <- (33.5, 25.5)
    tracks.append({'net': 'CAN_INDUCTIVE_PIN32', 'layer': 'bot', 'width': 0.7,
        'pts': [(33.5, 25.5), (33.5, 27.70), (100.04, 27.70)]})

    # 3. HX711 DOUT (Pin 37, Dest: 97.5, 32.78) <- (79.5, 20.1)
    # HX711 SCK (Pin 38, Dest: 100.04, 35.32) <- (84.0, 20.1)
    tracks.append({'net': 'HX711_SCK_38', 'layer': 'top', 'width': 0.55,
        'pts': [(84.0, 20.1), (84.0, 35.32), (100.04, 35.32)]})

    # 4. Chamber 3 (Paper) Signals:
    # PP_TOP_TRIG_33 (Pin 33, Dest: 97.5, 27.70) <- (74.4, 40.2)
    tracks.append({'net': 'PP_TOP_TRIG_33', 'layer': 'bot', 'width': 0.55,
        'pts': [(74.4, 40.2), (74.4, 36.5), (89.0, 36.5), (89.0, 27.70), (97.5, 27.70)]})
    # PP_TOP_ECHO_34 (Pin 34, Dest: 100.04, 30.24) <- (75.8, 40.2)
    tracks.append({'net': 'PP_TOP_ECHO_34', 'layer': 'top', 'width': 0.55,
        'pts': [(75.8, 40.2), (75.8, 30.24), (100.04, 30.24)]})
    # PP_IRIS_PWM_35 (Pin 35, Dest: 97.5, 30.24) <- (77.08, 32.0)
    tracks.append({'net': 'PP_IRIS_PWM_35', 'layer': 'bot', 'width': 0.55,
        'pts': [(77.08, 32.0), (77.08, 30.24), (97.5, 30.24)]})

    # 5. Chamber 2 (Metal) Remaining Signals:
    tracks.append({'net': 'M_TOP_TRIG_45', 'layer': 'bot', 'width': 0.55,
        'pts': [(63.7, 25.1), (63.7, 26.5), (92.0, 26.5), (92.0, 42.94), (97.5, 42.94)]})
    tracks.append({'net': 'M_MID_ECHO_44', 'layer': 'top', 'width': 0.55,
        'pts': [(58.7, 25.1), (58.7, 26.5), (91.0, 26.5), (91.0, 42.94), (100.04, 42.94)]})
    tracks.append({'net': 'M_TOP_ECHO_46', 'layer': 'top', 'width': 0.55,
        'pts': [(64.7, 25.1), (64.7, 27.5), (90.0, 27.5), (90.0, 45.48), (100.04, 45.48)]})

    # 6. M_ENTR_TRIG_25 (Pin 25, Dest: 97.5, 17.54) <- (45.7, 25.1)
    tracks.append({'net': 'M_ENTR_TRIG_25', 'layer': 'bot', 'width': 0.55,
        'pts': [(45.7, 25.1), (45.7, 17.54), (97.5, 17.54)]})

    cols = tf.check_collisions(tracks)
    print("Added signals. Collisions BOT:", len(cols['bot']), "TOP:", len(cols['top']))
    for c in cols['bot']:
        print("  BOT:", c[0], "<->", c[1])
    for c in cols['top']:
        print("  TOP:", c[0], "<->", c[1])

if __name__ == '__main__':
    test_full_set()
