using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIComboState : IAIState
    {
        private int hitsLanded = 0;
        private float nextHitAt = 0f;

        public void Enter(Player.FighterController f) { hitsLanded = 0; nextHitAt = 0f; }
        public void Exit(Player.FighterController f)
        {
            if (AIController.Instance != null) AIController.Instance.wantsLightPunch = false;
        }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null) return;
            if (Time.time < nextHitAt) return;
            if (hitsLanded >= 4) return;

            AIController.Instance.wantsLightPunch = true;
            nextHitAt = Time.time + 0.32f;
            hitsLanded++;
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (AIController.Instance.fsm.stateTime > 2.5f || hitsLanded >= 4) return new AIIdleState();
            if (AIController.Instance.ctx.distanceToOpponent > AIController.Instance.meleeRange + 0.5f) return new AIApproachState();
            return null;
        }
    }
}
