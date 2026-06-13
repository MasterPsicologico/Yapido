using UnityEngine;
using NarutoClash.ScriptableObjects;
using NarutoClash.VFX;

namespace NarutoClash.Substitution
{
    /// <summary>
    /// Gestiona las cargas de sustitución (default 3). Al ejecutar:
    /// 1. Spawnea un tronco de madera con humo donde estaba el fighter
    /// 2. Teletransporta al fighter detrás del rival
    /// 3. Inicia un breve periodo de invulnerabilidad
    /// </summary>
    [System.Serializable]
    public class SubstitutionSystem
    {
        public int charges;
        public int maxCharges;
        public float rechargeTimer;
        public float rechargeInterval;
        public FighterData data;
        public GameObject substitutionLogPrefab;
        public GameObject substitutionSmokePrefab;

        public SubstitutionSystem(FighterData d)
        {
            data = d;
            maxCharges = d != null ? d.substitutionCharges : 3;
            charges = maxCharges;
            rechargeInterval = d != null ? d.substitutionRechargeTime : 12f;
            rechargeTimer = 0f;
        }

        public bool CanSubstitute() => charges > 0;

        public void Tick(float dt)
        {
            if (charges >= maxCharges) return;
            rechargeTimer += dt;
            if (rechargeTimer >= rechargeInterval)
            {
                rechargeTimer = 0f;
                charges++;
            }
        }

        public void Execute(Player.FighterController self, Player.FighterController opponent)
        {
            if (!CanSubstitute()) return;
            charges--;

            if (VFXManager.Instance != null && substitutionLogPrefab != null)
            {
                VFXManager.Instance.SpawnSubstitutionLog(self.transform.position);
            }

            if (opponent != null)
            {
                Vector3 behind = opponent.transform.position;
                behind.x += (opponent.transform.position.x > self.transform.position.x ? -2.2f : 2.2f);
                self.transform.position = behind;
                if (VFXManager.Instance != null) VFXManager.Instance.SpawnSubstitutionLog(self.transform.position);
            }
        }
    }
}
