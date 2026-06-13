using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIIdleState : IAIState
    {
        public void Enter(Player.FighterController f) { }
        public void Exit(Player.FighterController f) { }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null) return;
            AIController.Instance.currentAxis = Vector2.zero;
            AIController.Instance.wantsLightPunch = false;
            AIController.Instance.wantsHeavyPunch = false;
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (f.CurrentState != Player.FighterController.FighterState.Idle) return null;
            if (AIController.Instance.fsm.stateTime < 0.1f) return null;
            AIController.Instance.Decide();
            return null;
        }
    }
}
