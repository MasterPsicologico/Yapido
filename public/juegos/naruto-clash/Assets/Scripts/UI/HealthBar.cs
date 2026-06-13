using UnityEngine;
using UnityEngine.UI;
using NarutoClash.Player;

namespace NarutoClash.UI
{
    public class HealthBar : MonoBehaviour
    {
        public Image fill;
        public Image drain;
        public Text nameText;
        public FighterController fighter;

        [Header("Animation")]
        public float drainLerpSpeed = 1.5f;

        private float displayedFill = 1f;
        private float targetFill = 1f;

        public void Bind(FighterController f)
        {
            fighter = f;
            if (nameText != null && f.Data != null) nameText.text = f.Data.displayName;
        }

        private void Update()
        {
            if (fighter == null || fighter.Data == null) return;
            targetFill = fighter.currentHealth / fighter.Data.maxHealth;
            displayedFill = Mathf.Lerp(displayedFill, targetFill, drainLerpSpeed * Time.deltaTime);
            if (fill != null) fill.fillAmount = targetFill;
            if (drain != null) drain.fillAmount = displayedFill;
        }
    }
}
