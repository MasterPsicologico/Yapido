using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using NarutoClash.Player;

namespace NarutoClash.Input
{
    /// <summary>
    /// Lee los inputs de los botones UI + joystick, los traduce a InputBuffer
    /// y los expone al FighterController. Singleton-friendly.
    /// </summary>
    public class MobileInputManager : MonoBehaviour
    {
        public static MobileInputManager Instance { get; private set; }

        [Header("References")]
        public VirtualJoystick joystick;
        public Button btnLightPunch;
        public Button btnHeavyPunch;
        public Button btnChakra;
        public Button btnSubstitution;
        public Button btnAwakening;

        [Header("Bindings")]
        public FighterController player1;
        public FighterController player2;

        public InputBuffer bufferP1 = new InputBuffer();
        public InputBuffer bufferP2 = new InputBuffer();
        public CommandReader reader = new CommandReader();

        [Header("Settings")]
        public int inputBufferSeconds = 1;
        public int inputBufferSize = 32;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            bufferP1.Configure(inputBufferSeconds, inputBufferSize);
            bufferP2.Configure(inputBufferSeconds, inputBufferSize);
        }

        private void OnEnable()
        {
            if (joystick != null) joystick.OnDirectionChanged += OnJoystickDir;
            WireButton(btnLightPunch, InputEventType.LightPunch_Press);
            WireButton(btnHeavyPunch, InputEventType.HeavyPunch_Press);
            WireButton(btnChakra, InputEventType.Chakra_Press);
            WireButton(btnSubstitution, InputEventType.Substitution_Press);
            WireButton(btnAwakening, InputEventType.Awakening_Press);
        }

        private void OnDisable()
        {
            if (joystick != null) joystick.OnDirectionChanged -= OnJoystickDir;
        }

        private void WireButton(Button b, InputEventType evt)
        {
            if (b == null) return;
            b.onClick.RemoveAllListeners();
            b.onClick.AddListener(() => OnButtonPressed(evt));
        }

        private void OnJoystickDir(InputEventType dir)
        {
            float now = Time.time;
            if (player1 != null) player1.buffer.Record(dir, Time.frameCount, now);
            if (player2 != null && player2.IsAI == false) player2.buffer.Record(dir, Time.frameCount, now);
        }

        private void OnButtonPressed(InputEventType evt)
        {
            float now = Time.time;
            if (player1 != null) player1.buffer.Record(evt, Time.frameCount, now);
            if (player2 != null && player2.IsAI == false) player2.buffer.Record(evt, Time.frameCount, now);
        }

        public bool IsChakraHeld() => btnChakra != null && IsButtonHeld(btnChakra);

        private Dictionary<Button, float> _lastDownTime = new Dictionary<Button, float>();
        private bool IsButtonHeld(Button b)
        {
            if (b == null) return false;
            IPointerDownHandler down; IPointerUpHandler up;
            b.TryGetComponent(out MonoBehaviour mb);
            return _lastDownTime.ContainsKey(b) && Time.time - _lastDownTime[b] > 0.05f && !PointerOverUI(b);
        }

        private bool PointerOverUI(Button b) => false;
    }
}
