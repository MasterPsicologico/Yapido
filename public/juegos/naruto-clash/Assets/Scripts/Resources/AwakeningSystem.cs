using UnityEngine;
using NarutoClash.ScriptableObjects;

namespace NarutoClash.Awakening
{
    /// <summary>
    /// Gestiona la barra de Despertar. Al activarse, cambia la forma del
    /// luchador (stats mejorados, acceso a super moves) durante un tiempo.
    /// </summary>
    [System.Serializable]
    public class AwakeningSystem
    {
        public int meter;
        public int required;
        public bool isActive;
        public float remainingSeconds;
        public float maxDuration;
        public FighterData baseData;
        public FighterData awakenedData;

        public AwakeningSystem(FighterData d)
        {
            baseData = d;
            awakenedData = d != null ? d.awakenedForm : null;
            required = d != null ? d.awakeningRequired : 100;
            maxDuration = d != null ? d.awakeningDuration : 25f;
            meter = 0;
            isActive = false;
            remainingSeconds = 0f;
        }

        public bool CanAwaken() => !isActive && meter >= required;

        public void Gain(int amount)
        {
            if (isActive) return;
            meter = Mathf.Min(required * 2, meter + amount);
        }

        public void Activate()
        {
            if (!CanAwaken()) return;
            isActive = true;
            remainingSeconds = maxDuration;
            meter = 0;
        }

        public void Deactivate()
        {
            isActive = false;
            remainingSeconds = 0f;
        }

        public void Tick(float dt)
        {
            if (!isActive) return;
            remainingSeconds -= dt;
            if (remainingSeconds <= 0) Deactivate();
        }

        public float NormalizedMeter => required > 0 ? (float)meter / required : 0f;
        public float NormalizedTime => isActive ? remainingSeconds / maxDuration : 0f;
    }
}
