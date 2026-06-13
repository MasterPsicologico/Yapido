using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIAttackState : IAIState
    {
        private float nextAttackAt = 0f;

        public void Enter(Player.FighterController f) { nextAttackAt = 0f; }
        public void Exit(Player.FighterController f)
        {
            if (AIController.Instance != null)
            {
                AIController.Instance.wantsLightPunch = false;
                AIController.Instance.wantsHeavyPunch = false;
            }
        }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null) return;
            if (Time.time < nextAttackAt) return;

            bool heavy = Random.value < 0.4f;
            AIController.Instance.wantsLightPunch = !heavy;
            AIController.Instance.wantsHeavyPunch = heavy;
            nextAttackAt = Time.time + (heavy ? 0.7f : 0.4f);
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (AIController.Instance.ctx.distanceToOpponent > AIController.Instance.meleeRange + 0.5f)
                return new AIApproachState();
            if (AIController.Instance.fsm.stateTime > 2.5f) return new AIIdleState();
            return null;
        }
    }
}
