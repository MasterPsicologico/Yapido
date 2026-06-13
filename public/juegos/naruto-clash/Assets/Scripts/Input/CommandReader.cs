using System.Collections.Generic;
using UnityEngine;
using NarutoClash.ScriptableObjects;

namespace NarutoClash.Input
{
    /// <summary>
    /// Lee el InputBuffer y detecta si se ejecutó el comando necesario para
    /// un MoveData con isSpecial = true. También maneja cancel windows.
    /// </summary>
    public class CommandReader
    {
        public const int CHARGE_FRAMES = 30;
        public const float DASH_TAP_WINDOW = 0.2f;

        public MoveData TryReadSpecial(
            InputBuffer buffer,
            float now,
            FighterData data,
            MoveData currentMove,
            int currentMoveFrame,
            bool isRecovering,
            bool isAttacking,
            int facing = 1)
        {
            if (data == null || data.moveset == null) return null;

            MoveData bestMatch = null;
            int bestPriority = -1;

            for (int i = 0; i < data.moveset.Length; i++)
            {
                MoveData m = data.moveset[i];
                if (m == null || !m.isSpecial || m.isAwakeningMove) continue;
                if (m.chakraCost > 0) continue;

                if (isAttacking && m.cancelInto != null)
                {
                    bool canChain = false;
                    for (int c = 0; c < m.cancelInto.Length; c++)
                    {
                        if (m.cancelInto[c] == currentMove) { canChain = true; break; }
                    }
                    if (!canChain) continue;
                }
                else if (isAttacking || isRecovering)
                {
                    if (currentMove == null || !CanCancel(currentMove, m, currentMoveFrame)) continue;
                }

                if (Matches(buffer, now, m.command, facing))
                {
                    if ((int)m.command > bestPriority)
                    {
                        bestMatch = m;
                        bestPriority = (int)m.command;
                    }
                }
            }

            return bestMatch;
        }

        public MoveData TryReadAwakening(InputBuffer buffer, float now, FighterData data, int facing = 1)
        {
            if (data == null || data.moveset == null) return null;
            for (int i = 0; i < data.moveset.Length; i++)
            {
                MoveData m = data.moveset[i];
                if (m == null || !m.isAwakeningMove) continue;
                if (Matches(buffer, now, m.command, facing)) return m;
            }
            return null;
        }

        public bool Matches(InputBuffer buffer, float now, MoveData.InputCommand cmd, int facing)
        {
            switch (cmd)
            {
                case MoveData.InputCommand.QCF_Light:
                    return MatchQuarterCircle(buffer, now, facing, false, true);
                case MoveData.InputCommand.QCF_Heavy:
                    return MatchQuarterCircle(buffer, now, facing, false, false) && HasRecentButton(buffer, now, true, false);
                case MoveData.InputCommand.DP_Light:
                    return MatchDragonPunch(buffer, now, facing, true);
                case MoveData.InputCommand.DP_Heavy:
                    return MatchDragonPunch(buffer, now, facing, false);
                case MoveData.InputCommand.HCB_Heavy:
                    return MatchHalfCircleBack(buffer, now, facing, false);
                case MoveData.InputCommand.ChargeBack_Heavy:
                    return MatchCharge(buffer, now, -facing) && HasRecentButton(buffer, now, false, true);
                case MoveData.InputCommand.QuarterCircleBack_Light:
                    return MatchQuarterCircle(buffer, now, facing, true, true);
                case MoveData.InputCommand.HalfCircleForward_Heavy:
                    return MatchHalfCircleForward(buffer, now, facing, false);
                case MoveData.InputCommand.DoubleTapForward:
                    return MatchDoubleTap(buffer, now, facing, 1);
                case MoveData.InputCommand.DoubleTapBack:
                    return MatchDoubleTap(buffer, now, facing, -1);
                default:
                    return false;
            }
        }

        private bool HasRecentButton(InputBuffer buffer, float now, bool light, bool heavy)
        {
            return buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.12f, now)
                || buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.12f, now);
        }

        private bool MatchQuarterCircle(InputBuffer buffer, float now, int facing, bool reverse, bool light)
        {
            InputEventType d1 = reverse ? (facing > 0 ? InputEventType.JoystickDownLeft : InputEventType.JoystickDownRight)
                                        : (facing > 0 ? InputEventType.JoystickDownRight : InputEventType.JoystickDownLeft);
            InputEventType d2 = reverse ? InputEventType.JoystickLeft : InputEventType.JoystickRight;
            InputEventType dir = reverse ? InputEventType.JoystickLeft : InputEventType.JoystickRight;

            return MatchSequence(buffer, now, 0.25f,
                InputEventType.JoystickDown, d1, dir)
                && (light ? buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.12f, now)
                          : buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.12f, now));
        }

        private bool MatchDragonPunch(InputBuffer buffer, float now, int facing, bool light)
        {
            InputEventType d1 = facing > 0 ? InputEventType.JoystickDownRight : InputEventType.JoystickDownLeft;
            InputEventType dir = facing > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            return MatchSequence(buffer, now, 0.20f, dir, d1, InputEventType.JoystickDown)
                && (light ? buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.12f, now)
                          : buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.12f, now));
        }

        private bool MatchHalfCircleBack(InputBuffer buffer, float now, int facing, bool light)
        {
            InputEventType s1 = facing > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            InputEventType s2 = facing > 0 ? InputEventType.JoystickUpRight : InputEventType.JoystickUpLeft;
            InputEventType s3 = InputEventType.JoystickUp;
            InputEventType s4 = facing > 0 ? InputEventType.JoystickUpLeft : InputEventType.JoystickUpRight;
            InputEventType end = facing > 0 ? InputEventType.JoystickLeft : InputEventType.JoystickRight;
            return MatchSequence(buffer, now, 0.30f, s1, s2, s3, s4, end)
                && (light ? buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.12f, now)
                          : buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.12f, now));
        }

        private bool MatchHalfCircleForward(InputBuffer buffer, float now, int facing, bool light)
        {
            InputEventType s1 = facing > 0 ? InputEventType.JoystickLeft : InputEventType.JoystickRight;
            InputEventType s2 = facing > 0 ? InputEventType.JoystickDownLeft : InputEventType.JoystickDownRight;
            InputEventType s3 = InputEventType.JoystickDown;
            InputEventType s4 = facing > 0 ? InputEventType.JoystickDownRight : InputEventType.JoystickDownLeft;
            InputEventType end = facing > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            return MatchSequence(buffer, now, 0.30f, s1, s2, s3, s4, end)
                && (light ? buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.12f, now)
                          : buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.12f, now));
        }

        private bool MatchCharge(InputBuffer buffer, float now, int dirSign)
        {
            InputEventType held = dirSign > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            InputEventType forward = dirSign > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            return buffer.ContainsRecent(held, 0.6f, now)
                && buffer.ContainsRecent(forward, 0.1f, now);
        }

        private bool MatchDoubleTap(InputBuffer buffer, float now, int facing, int dirSign)
        {
            InputEventType dir = dirSign > 0
                ? (facing > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft)
                : (facing > 0 ? InputEventType.JoystickLeft : InputEventType.JoystickRight);
            int count = 0;
            float cutoff = now - DASH_TAP_WINDOW;
            foreach (var e in buffer.Events)
            {
                if (e.time < cutoff) continue;
                if (e.type == dir) count++;
            }
            return count >= 2;
        }

        private bool MatchSequence(InputBuffer buffer, float now, float window, params InputEventType[] types)
        {
            if (types.Length == 0) return false;
            var arr = new List<InputEvent>(buffer.Events);
            int idx = types.Length - 1;
            float lastTime = now;
            for (int i = arr.Count - 1; i >= 0 && idx >= 0; i--)
            {
                if (arr[i].type != types[idx]) continue;
                if (arr[i].time > lastTime) continue;
                if ((lastTime - arr[i].time) > window) return false;
                lastTime = arr[i].time;
                idx--;
            }
            return idx < 0;
        }

        private bool CanCancel(MoveData current, MoveData next, int currentFrame)
        {
            if (current.cancelInto == null) return false;
            for (int i = 0; i < current.cancelInto.Length; i++)
            {
                if (current.cancelInto[i] == next)
                {
                    int localFrame = currentFrame;
                    return localFrame >= current.cancelWindowStart && localFrame <= current.cancelWindowEnd;
                }
            }
            return false;
        }
    }
}
