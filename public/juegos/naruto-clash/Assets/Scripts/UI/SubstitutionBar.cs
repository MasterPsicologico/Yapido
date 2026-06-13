using UnityEngine;
using UnityEngine.UI;
using NarutoClash.Player;

namespace NarutoClash.UI
{
    /// <summary>
    /// 3 puntos/iconos que indican las cargas de sustitución restantes.
    /// </summary>
    public class SubstitutionBar : MonoBehaviour
    {
        public Image[] chargeIcons;
        public Sprite activeSprite;
        public Sprite emptySprite;
        public FighterController fighter;

        public void Bind(FighterController f) { fighter = f; }

        private void Update()
        {
            if (fighter == null) return;
            for (int i = 0; i < chargeIcons.Length; i++)
            {
                if (chargeIcons[i] == null) continue;
                chargeIcons[i].sprite = i < fighter.substitutionCharges ? activeSprite : emptySprite;
                chargeIcons[i].color = i < fighter.substitutionCharges ? Color.white : new Color(1, 1, 1, 0.25f);
            }
        }
    }
}
