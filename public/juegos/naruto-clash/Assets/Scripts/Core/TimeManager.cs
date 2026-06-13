using UnityEngine;

namespace NarutoClash.Core
{
    /// <summary>
    /// Singleton para congelar/ralentizar el tiempo del juego (hitstop, slow-mo).
    /// Usa timeScale + timeScale fijo: el hitstop es tiempo real, no escalado.
    /// </summary>
    public class TimeManager : MonoBehaviour
    {
        public static TimeManager Instance { get; private set; }

        private float freezeRemaining = 0f;
        private float originalFixedDelta = 0.02f;
        public float slowMoFactor = 1f;
        public float slowMoRemaining = 0f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            originalFixedDelta = Time.fixedDeltaTime;
        }

        public void Freeze(float seconds)
        {
            freezeRemaining = Mathf.Max(freezeRemaining, seconds);
            Time.timeScale = 0f;
            Time.fixedDeltaTime = originalFixedDelta;
        }

        public void SlowMotion(float factor, float seconds)
        {
            slowMoFactor = Mathf.Clamp(factor, 0.1f, 1f);
            slowMoRemaining = Mathf.Max(slowMoRemaining, seconds);
            Time.timeScale = slowMoFactor;
            Time.fixedDeltaTime = originalFixedDelta * slowMoFactor;
        }

        private void Update()
        {
            if (freezeRemaining > 0)
            {
                freezeRemaining -= Time.unscaledDeltaTime;
                if (freezeRemaining <= 0)
                {
                    Time.timeScale = slowMoFactor;
                    Time.fixedDeltaTime = originalFixedDelta * slowMoFactor;
                }
            }
            else if (slowMoRemaining > 0)
            {
                slowMoRemaining -= Time.unscaledDeltaTime;
                if (slowMoRemaining <= 0)
                {
                    slowMoFactor = 1f;
                    Time.timeScale = 1f;
                    Time.fixedDeltaTime = originalFixedDelta;
                }
            }
        }
    }
}
