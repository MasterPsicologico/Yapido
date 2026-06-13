using System;
using UnityEngine;

namespace NarutoClash.ScriptableObjects
{
    public enum AttackLevel { High, Mid, Low, Throw }
    public enum AttackType { Strike, Projectile, Counter, Grab, Awakening }

    [Serializable]
    public class HitboxFrame
    {
        [Tooltip("Frame relativo dentro del MoveData (0 = primer frame activo).")]
        public int frameIndex;
        [Tooltip("Offset local respecto a Hitbox_Origin.")]
        public Vector2 localOffset;
        [Tooltip("Tamaño del BoxCollider en este frame.")]
        public Vector2 size = new Vector2(1.2f, 0.6f);
        [Tooltip("Nombre del GameObject hijo bajo Hitbox_Origin que se activa.")]
        public string hitboxName = "Hitbox_Default";
        [Tooltip("Capas (layers) con las que colisiona — normalmente Hurtboxes del rival.")]
        public LayerMask hitMask;
    }

    [CreateAssetMenu(fileName = "NewMoveData", menuName = "NarutoClash/Move Data", order = 1)]
    public class MoveData : ScriptableObject
    {
        public enum InputCommand
        {
            None,
            LightPunch,
            HeavyPunch,
            LightPunch_Crouch,
            HeavyPunch_Crouch,
            LightPunch_Air,
            HeavyPunch_Air,
            QCF_Light,
            QCF_Heavy,
            DP_Light,
            DP_Heavy,
            HCB_Heavy,
            ChargeBack_Heavy,
            QuarterCircleBack_Light,
            HalfCircleForward_Heavy,
            DoubleTapForward,
            DoubleTapBack,
            Awakening
        }

        [Header("Identity")]
        public string moveId = "light_punch";
        public string displayName = "Light Punch";
        public InputCommand command = InputCommand.LightPunch;

        [Header("Frame Data (60 FPS fixed)")]
        [Min(1)] public int startupFrames = 4;
        [Min(1)] public int activeFrames = 3;
        [Min(1)] public int recoveryFrames = 6;

        [Header("Damage & Stun")]
        [Min(0)] public int damage = 30;
        [Min(0)] public int hitstun = 14;
        [Min(0)] public int blockstun = 8;
        [Min(0)] public int hitstopFrames = 6;
        [Min(0)] public int chipDamagePercent = 10;

        [Header("Movement")]
        public Vector2 attackerVelocity = Vector2.zero;
        [Min(0)] public float pushbackOnHit = 1.5f;
        [Min(0)] public float pushbackOnBlock = 1.0f;
        [Min(0)] public float airborneLaunch = 0f;
        public bool launchesOnHit = false;
        public bool hardKnockdown = false;

        [Header("Combat Type")]
        public AttackLevel attackLevel = AttackLevel.Mid;
        public AttackType attackType = AttackType.Strike;
        [Min(0)] public int chakraCost = 0;
        public bool isSpecial = false;
        public bool isAwakeningMove = false;
        [Tooltip("Cancelar desde qué estados es válido. Por defecto solo desde Idle/Walk/Crouch.")]
        public bool canCancelFromIdle = true;
        public bool canCancelFromWalk = true;
        public bool canCancelFromCrouch = true;
        public bool canCancelFromAir = false;
        public bool canCancelFromAnyAttack = false;

        [Header("Cancel Into (move chaining)")]
        public MoveData[] cancelInto;

        [Header("Hitbox Frames")]
        public HitboxFrame[] hitboxFrames;

        [Header("Animation")]
        public string animationTrigger = "attack_light";
        public string animationState = "LightPunch";

        [Header("VFX / SFX")]
        public GameObject vfxOnActivation;
        public Vector2 vfxLocalOffset = Vector2.zero;
        public GameObject vfxOnImpact;
        public AudioClip sfxOnActivation;
        public AudioClip sfxOnImpact;
        public AudioClip voxOnActivation;

        [Header("Input Window")]
        [Tooltip("Cuántos frames ANTES del primer active frame el CommandReader puede leer el comando.")]
        [Min(0)] public int inputWindowBefore = 8;
        [Tooltip("Cuántos frames DURANTE el move se permite cancelar al siguiente.")]
        [Min(0)] public int cancelWindowStart = 0;
        [Min(0)] public int cancelWindowEnd = 999;

        public int TotalFrames => startupFrames + activeFrames + recoveryFrames;

        public HitboxFrame GetActiveFrame(int localFrame)
        {
            if (hitboxFrames == null) return null;
            for (int i = 0; i < hitboxFrames.Length; i++)
            {
                if (hitboxFrames[i] != null && hitboxFrames[i].frameIndex == localFrame) return hitboxFrames[i];
            }
            return null;
        }
    }
}
