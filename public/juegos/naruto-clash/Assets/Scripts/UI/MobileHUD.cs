using UnityEngine;
using UnityEngine.UI;
using NarutoClash.Player;

namespace NarutoClash.UI
{
    /// <summary>
    /// HUD de combate: construye/controla joystick, botones, barras de vida,
    /// chakra, sustitución y el botón de Despertar. Pensado para 9:16 portrait.
    /// </summary>
    public class MobileHUD : MonoBehaviour
    {
        [Header("References")]
        public FighterController player1;
        public FighterController player2;
        public Input.MobileInputManager input;
        public Input.VirtualJoystick joystick;

        [Header("Top bars (P1 left, P2 right)")]
        public RectTransform p1BarsRoot;
        public RectTransform p2BarsRoot;
        public HealthBar p1Health;
        public HealthBar p2Health;
        public ChakraBar p1Chakra;
        public ChakraBar p2Chakra;
        public SubstitutionBar p1Subs;
        public SubstitutionBar p2Subs;

        [Header("Awakening")]
        public Image p1AwakeningFill;
        public Image p2AwakeningFill;
        public GameObject p1AwakenedIcon;
        public GameObject p2AwakenedIcon;

        [Header("Timer")]
        public Text timerText;

        [Header("Round/Win indicators")]
        public Text p1WinsText;
        public Text p2WinsText;

        private void OnEnable()
        {
            if (player1 == null) return;
            BindFighter(player1, p1Health, p1Chakra, p1Subs, p1AwakeningFill, p1AwakenedIcon, true);
            if (player2 != null) BindFighter(player2, p2Health, p2Chakra, p2Subs, p2AwakeningFill, p2AwakenedIcon, false);
        }

        private void BindFighter(FighterController f, HealthBar hp, ChakraBar ch, SubstitutionBar sb, Image aw, GameObject awIcon, bool mirror)
        {
            if (hp != null) hp.Bind(f);
            if (ch != null) ch.Bind(f);
            if (sb != null) sb.Bind(f);
            if (aw != null) aw.fillAmount = 0f;
            if (awIcon != null) awIcon.SetActive(false);
        }

        private void Update()
        {
            if (player1 == null) return;
            UpdateAwakeningUI(player1, p1AwakeningFill, p1AwakenedIcon);
            if (player2 != null) UpdateAwakeningUI(player2, p2AwakeningFill, p2AwakenedIcon);
            if (timerText != null && Core.GameManager.Instance != null)
                timerText.text = Mathf.CeilToInt(Core.GameManager.Instance.currentTime).ToString("00");
            if (p1WinsText != null && Core.GameManager.Instance != null) p1WinsText.text = Core.GameManager.Instance.p1Wins.ToString();
            if (p2WinsText != null && Core.GameManager.Instance != null) p2WinsText.text = Core.GameManager.Instance.p2Wins.ToString();
        }

        private void UpdateAwakeningUI(FighterController f, Image aw, GameObject awIcon)
        {
            if (f == null || f.Data == null) return;
            if (aw != null) aw.fillAmount = f.awakening != null ? f.awakening.NormalizedMeter : 0f;
            if (awIcon != null) awIcon.SetActive(f.isAwakened);
        }

        public void OnLightPunch()
        {
            if (input != null) input.OnButtonPressed(Input.InputEventType.LightPunch_Press);
        }

        public void OnHeavyPunch()
        {
            if (input != null) input.OnButtonPressed(Input.InputEventType.HeavyPunch_Press);
        }

        public void OnChakraDown()
        {
            if (input != null) input.OnButtonPressed(Input.InputEventType.Chakra_Press);
        }

        public void OnSubstitution()
        {
            if (input != null) input.OnButtonPressed(Input.InputEventType.Substitution_Press);
        }

        public void OnAwakening()
        {
            if (input != null) input.OnButtonPressed(Input.InputEventType.Awakening_Press);
        }
    }
}
