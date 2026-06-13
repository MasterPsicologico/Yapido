using UnityEngine;
using NarutoClash.ScriptableObjects;

namespace NarutoClash.Combat
{
    /// <summary>
    /// Marca este collider como una zona de golpe. Solo se activa durante los
    /// active frames del MoveData actual. El padre debe tener un FighterController.
    /// </summary>
    [RequireComponent(typeof(BoxCollider2D))]
    public class Hitbox : MonoBehaviour
    {
        [Header("Owner")]
        public Player.FighterController owner;

        [Header("State")]
        [SerializeField] private bool isActive = false;
        public bool IsActive => isActive;
        public bool HasHitThisActivation { get; private set; }

        [Header("Properties")]
        public AttackLevel level = AttackLevel.Mid;
        public AttackType type = AttackType.Strike;

        [Header("Per-activation data")]
        public int damage;
        public int hitstun;
        public int blockstun;
        public int hitstopFrames;
        public int chipDamagePercent;
        public float pushbackOnHit;
        public float pushbackOnBlock;
        public bool launchesOnHit;
        public bool hardKnockdown;

        private BoxCollider2D box;

        private void Awake()
        {
            box = GetComponent<BoxCollider2D>();
            box.isTrigger = true;
            Deactivate();
        }

        public void Activate(
            int dmg, int hstun, int bstun, int hstop, int chip,
            float pushHit, float pushBlock, bool launch, bool hardKD)
        {
            damage = dmg;
            hitstun = hstun;
            blockstun = bstun;
            hitstopFrames = hstop;
            chipDamagePercent = chip;
            pushbackOnHit = pushHit;
            pushbackOnBlock = pushBlock;
            launchesOnHit = launch;
            hardKnockdown = hardKD;
            HasHitThisActivation = false;
            isActive = true;
            box.enabled = true;
        }

        public void Deactivate()
        {
            isActive = false;
            if (box != null) box.enabled = false;
        }

        public void ResetForNewActivation()
        {
            HasHitThisActivation = false;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!isActive || HasHitThisActivation) return;
            if (owner == null || owner.IsKO) return;

            Hurtbox hurtbox = other.GetComponent<Hurtbox>();
            if (hurtbox == null) return;
            if (hurtbox.owner == null) return;
            if (hurtbox.owner == owner) return;
            if (hurtbox.owner.IsKO) return;
            if (hurtbox.owner.IsInvulnerable) return;

            Combat.CombatResolver.ResolveHit(this, hurtbox);
            HasHitThisActivation = true;
        }
    }
}
