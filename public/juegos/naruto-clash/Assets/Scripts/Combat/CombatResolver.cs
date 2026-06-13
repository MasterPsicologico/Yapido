using UnityEngine;
using NarutoClash.Player;

namespace NarutoClash.Combat
{
    /// <summary>
    /// Lógica pura de resolución de combate. Sin estado propio.
    /// Llamada por Hitbox.OnTriggerEnter2D cuando un golpe conecta.
    /// </summary>
    public static class CombatResolver
    {
        public static void ResolveHit(Hitbox hit, Hurtbox hurt)
        {
            FighterController attacker = hit.owner;
            FighterController defender = hurt.owner;
            if (attacker == null || defender == null) return;

            bool blocked = TryBlock(hit, hurt, defender, out bool throwBreak);

            if (blocked)
            {
                ApplyBlock(hit, defender);
            }
            else
            {
                ApplyHit(hit, defender);
            }

            attacker.OnAttackLanded(hit, defender, blocked);
        }

        private static bool TryBlock(Hitbox hit, Hurtbox hurt, FighterController defender, out bool throwBreak)
        {
            throwBreak = false;
            if (!defender.IsHoldingBlock) return false;
            if (hit.type == AttackType.Throw) return false;
            if (hit.type == AttackType.Counter) return false;

            bool defenderStanding = defender.CurrentState == FighterController.FighterState.Idle
                                    || defender.CurrentState == FighterController.FighterState.Walking
                                    || defender.CurrentState == FighterController.FighterState.Blocking;
            bool defenderCrouching = defender.CurrentState == FighterController.FighterState.Crouching;
            bool defenderAirborne = defender.CurrentState == FighterController.FighterState.Jumping;

            switch (hit.level)
            {
                case AttackLevel.High:
                    return defenderStanding || defenderAirborne;
                case AttackLevel.Mid:
                    return defenderStanding || defenderCrouching;
                case AttackLevel.Low:
                    return defenderCrouching;
                case AttackLevel.Throw:
                    return false;
            }
            return false;
        }

        private static void ApplyHit(Hitbox hit, FighterController defender)
        {
            int finalDamage = Mathf.RoundToInt(hit.damage * (hit.owner.Data != null ? hit.owner.Data.hitstunMultiplier : 1f));
            defender.ApplyDamage(finalDamage, hit.hitstun, hit.launchesOnHit, hit.hardKnockdown, hit.hitstopFrames, hit.pushbackOnHit, hit.hitbox.transform.position);

            if (hit.owner != null)
            {
                hit.owner.OnHitConnected(finalDamage);
            }
        }

        private static void ApplyBlock(Hitbox hit, FighterController defender)
        {
            int chip = Mathf.RoundToInt(hit.damage * (hit.chipDamagePercent / 100f));
            if (chip > 0) defender.ApplyChipDamage(chip);
            defender.ApplyBlockstun(hit.blockstun, hit.pushbackOnBlock, hit.hitbox.transform.position);
        }
    }
}
