using UnityEngine;
using NarutoClash.ScriptableObjects;

namespace NarutoClash.Chakra
{
    /// <summary>
    /// Gestiona la barra de chakra. Se recarga manteniendo el botón Chakra
    /// (vulnerable) o al conectar golpes.
    /// </summary>
    [System.Serializable]
    public class ChakraSystem
    {
        public float current;
        public float max;
        public bool isRecharging;
        public FighterData data;

        public ChakraSystem(FighterData d)
        {
            data = d;
            max = d != null ? d.maxChakra : 100;
            current = 0;
            isRecharging = false;
        }

        public float Normalized => max > 0 ? current / max : 0f;

        public bool TryConsume(int amount)
        {
            if (current < amount) return false;
            current -= amount;
            return true;
        }

        public void Gain(int amount)
        {
            current = Mathf.Min(max, current + amount);
        }

        public void Tick(float dt, bool holding)
        {
            if (holding && data != null)
            {
                isRecharging = true;
                current = Mathf.Min(max, current + data.chakraPerSecondRecharge * dt);
            }
            else
            {
                isRecharging = false;
            }
        }
    }
}
