using UnityEngine;
using UnityEngine.UI;
using NarutoClash.Player;

namespace NarutoClash.UI
{
    public class ChakraBar : MonoBehaviour
    {
        public Image fill;
        public FighterController fighter;

        private void Update()
        {
            if (fighter == null || fighter.Data == null) return;
            float pct = fighter.chakra != null ? fighter.chakra.Normalized : 0f;
            if (fill != null) fill.fillAmount = pct;
        }
    }
}
