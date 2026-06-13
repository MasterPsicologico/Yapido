using UnityEngine;

namespace NarutoClash.ScriptableObjects
{
    [CreateAssetMenu(fileName = "NewFighterData", menuName = "NarutoClash/Fighter Data", order = 0)]
    public class FighterData : ScriptableObject
    {
        [Header("Identity")]
        public string fighterId = "naruto";
        public string displayName = "Naruto Uzumaki";
        public Sprite portrait;
        public Sprite icon;

        [Header("Vitals")]
        [Min(1)] public int maxHealth = 1000;
        [Min(0)] public int maxChakra = 100;
        [Min(0)] public int awakeningRequired = 100;

        [Header("Movement")]
        [Min(0)] public float walkSpeed = 3.5f;
        [Min(0)] public float crouchSpeed = 1.0f;
        [Min(0)] public float jumpForce = 12f;
        [Min(0)] public int maxJumps = 1;
        [Min(0)] public float airControl = 0.4f;
        [Min(0)] public float dashSpeed = 8f;
        [Min(0)] public float dashDuration = 0.18f;
        [Min(0)] public float dashCooldown = 0.4f;

        [Header("Combat")]
        [Min(0)] public int baseDamage = 10;
        [Min(0)] public float hitstunMultiplier = 1.0f;
        [Min(0)] public float blockstunMultiplier = 1.0f;
        [Min(0)] public float pushbackMultiplier = 1.0f;
        [Min(0)] public int substitutionCharges = 3;
        [Min(0)] public float substitutionRechargeTime = 12f;
        [Min(0)] public int substitutionWindowFrames = 6;

        [Header("Resource Gain")]
        [Min(0)] public int chakraPerHitLanded = 4;
        [Min(0)] public int chakraPerHitReceived = 2;
        [Min(0)] public int chakraPerSecondRecharge = 30;
        [Min(0)] public int awakeningPerComboHit = 3;
        [Min(0)] public int awakeningPerSpecialLanded = 8;

        [Header("Visual")]
        public RuntimeAnimatorController animatorController;
        public Sprite[] idleFrames;
        public Color tintColor = Color.white;
        public Vector2 spriteScale = Vector2.one;
        public Vector2 spritePivot = new Vector2(0.5f, 0f);

        [Header("Awakening Form (optional)")]
        public FighterData awakenedForm;
        public float awakeningDuration = 25f;

        [Header("Moveset")]
        public MoveData[] moveset;

        [Header("Combos")]
        public ComboData[] combos;

        [Header("AI Personality")]
        [Range(0, 1)] public float aiBlockChance = 0.5f;
        [Range(0, 1)] public float aiAggression = 0.6f;
        [Range(0, 1)] public float aiRangedChance = 0.3f;
        [Range(0, 1)] public float aiComboChance = 0.4f;
        [Range(0, 1)] public float aiSubstitutionChance = 0.5f;
        [Min(0)] public float aiReactionTime = 0.15f;

        public MoveData GetMove(string id)
        {
            if (moveset == null) return null;
            for (int i = 0; i < moveset.Length; i++)
            {
                if (moveset[i] != null && moveset[i].moveId == id) return moveset[i];
            }
            return null;
        }

        public MoveData GetMove(MoveData.InputCommand cmd)
        {
            if (moveset == null) return null;
            for (int i = 0; i < moveset.Length; i++)
            {
                if (moveset[i] != null && moveset[i].command == cmd && !moveset[i].isAwakeningMove)
                    return moveset[i];
            }
            return null;
        }

        public MoveData GetAwakeningMove()
        {
            if (moveset == null) return null;
            for (int i = 0; i < moveset.Length; i++)
            {
                if (moveset[i] != null && moveset[i].isAwakeningMove) return moveset[i];
            }
            return null;
        }
    }
}
