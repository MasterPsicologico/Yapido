using System.Collections.Generic;
using UnityEngine;

namespace NarutoClash.Input
{
    /// <summary>
    /// Evento crudo de input con timestamp. Se enqueuea por MobileInputManager
    /// y se lee desde CommandReader.
    /// </summary>
    public enum InputEventType
    {
        JoystickNeutral,
        JoystickUp,
        JoystickDown,
        JoystickLeft,
        JoystickRight,
        JoystickUpLeft,
        JoystickUpRight,
        JoystickDownLeft,
        JoystickDownRight,
        LightPunch_Press,
        LightPunch_Hold,
        LightPunch_Release,
        HeavyPunch_Press,
        HeavyPunch_Hold,
        HeavyPunch_Release,
        Chakra_Press,
        Chakra_Hold,
        Chakra_Release,
        Substitution_Press,
        Awakening_Press,
        Dash
    }

    public struct InputEvent
    {
        public InputEventType type;
        public int frame;
        public float time;

        public InputEvent(InputEventType t, int f, float ti)
        {
            type = t; frame = f; time = ti;
        }
    }

    /// <summary>
    /// Cola circular de inputs. Retiene los últimos N durante M segundos.
    /// El CommandReader recorre esta cola para detectar special moves.
    /// </summary>
    public class InputBuffer
    {
        public const int MAX_BUFFER_SIZE = 32;
        public const float DEFAULT_BUFFER_SECONDS = 0.5f;

        private readonly LinkedList<InputEvent> events = new LinkedList<InputEvent>();
        private float bufferSeconds = DEFAULT_BUFFER_SECONDS;
        private int maxSize = MAX_BUFFER_SIZE;

        public void Configure(float seconds, int size)
        {
            bufferSeconds = seconds;
            maxSize = Mathf.Max(4, size);
        }

        public void Record(InputEventType type, int frame, float time)
        {
            events.AddLast(new InputEvent(type, frame, time));
            Prune(time);
            while (events.Count > maxSize) events.RemoveFirst();
        }

        public void Clear() => events.Clear();

        public IReadOnlyCollection<InputEvent> Events => events;

        public bool ContainsRecent(InputEventType type, float maxAgeSeconds, float now)
        {
            float cutoff = now - maxAgeSeconds;
            foreach (var e in events)
            {
                if (e.time < cutoff) continue;
                if (e.type == type) return true;
            }
            return false;
        }

        private void Prune(float now)
        {
            float cutoff = now - bufferSeconds;
            while (events.First != null && events.First.Value.time < cutoff)
            {
                events.RemoveFirst();
            }
        }
    }
}
