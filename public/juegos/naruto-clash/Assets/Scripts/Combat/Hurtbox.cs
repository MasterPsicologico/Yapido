using UnityEngine;

namespace NarutoClash.Combat
{
    /// <summary>
    /// Zona del cuerpo que recibe daño. Hay 3 por luchador: High (cabeza),
    /// Mid (torso), Low (piernas). El estado del rival (parado/agachado/saltando)
    /// determina qué hurtbox está activa para bloqueo.
    /// </summary>
    [RequireComponent(typeof(BoxCollider2D))]
    public class Hurtbox : MonoBehaviour
    {
        public enum Region { High, Mid, Low, Throw }

        [Header("Owner")]
        public Player.FighterController owner;

        [Header("Region")]
        public Region region = Region.Mid;

        [Header("Active when")]
        [Tooltip("Si false, esta hurtbox está activa solo cuando el luchador está de pie.")]
        public bool activeWhileStanding = true;
        public bool activeWhileCrouching = false;
        public bool activeWhileJumping = false;
        public bool activeWhileBlocking = true;
        public bool activeWhileAttacking = true;
        public bool activeWhileKO = false;

        private BoxCollider2D box;

        private void Awake()
        {
            box = GetComponent<BoxCollider2D>();
            box.isTrigger = true;
        }

        private void LateUpdate()
        {
            if (owner == null)
            {
                box.enabled = true;
                return;
            }

            bool active = false;
            var st = owner.CurrentState;
            switch (st)
            {
                case Player.FighterController.FighterState.Idle:
                case Player.FighterController.FighterState.Walking:
                    active = activeWhileStanding; break;
                case Player.FighterController.FighterState.Crouching:
                    active = activeWhileCrouching; break;
                case Player.FighterController.FighterState.Jumping:
                    active = activeWhileJumping; break;
                case Player.FighterController.FighterState.Blocking:
                case Player.FighterController.FighterState.Blockstun:
                    active = activeWhileBlocking; break;
                case Player.FighterController.FighterState.Attacking:
                case Player.FighterController.FighterState.SpecialAttacking:
                case Player.FighterController.FighterState.Hit:
                case Player.FighterController.FighterState.Knockdown:
                case Player.FighterController.FighterState.Substitution:
                case Player.FighterController.FighterState.Awakening:
                    active = activeWhileAttacking; break;
                case Player.FighterController.FighterState.KO:
                case Player.FighterController.FighterState.Wakeup:
                    active = activeWhileKO; break;
            }

            box.enabled = active;
        }
    }
}
