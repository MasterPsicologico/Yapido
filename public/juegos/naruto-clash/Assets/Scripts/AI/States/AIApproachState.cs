using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIApproachState : IAIState
    {
        public void Enter(Player.FighterController f) { }
        public void Exit(Player.FighterController f) { }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null || f.opponent == null) return;
            float dirX = f.opponent.transform.position.x > f.transform.position.x ? 1f : -1f;
            AIController.Instance.currentAxis = new Vector2(dirX, 0f);
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (AIController.Instance.ctx.distanceToOpponent <= AIController.Instance.meleeRange)
            {
                AIController.Instance.Decide();
                return null;
            }
            if (AIController.Instance.fsm.stateTime > 3f) return new AIIdleState();
            return null;
        }
    }
}
