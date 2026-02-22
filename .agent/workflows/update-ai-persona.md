---
description: Update the AI judge's personality and scoring behavior
---
# Update AI Persona

## Files to Modify

### Main Prompt: `src/services/gemini.js`

The `judgeSubmission` function contains the AI prompt. Key sections:

1. **Persona Instructions**: Sets the tone (e.g., "sassy game show host")
2. **Scoring Criteria**: Defines what makes a good connection (0-10 scale)
3. **Response Format**: JSON structure for score and feedback

## Example Persona Change

```javascript
const prompt = `You are a [NEW PERSONA DESCRIPTION].
Your job is to judge how well a player connected two concepts.

Scoring Guide:
- 10: Brilliant, unexpected connection
- 7-9: Creative and valid
- 4-6: Acceptable but basic
- 1-3: Weak or forced connection
- 0: No valid connection

Response Format (JSON only):
{
  "score": number,
  "feedback": "your witty response",
  "breakdown": {
    "creativity": number,
    "relevance": number,
    "humor": number
  }
}`;
```

## Testing
1. Start dev server with `/dev`
2. Play a round and check AI responses
3. Deploy with `/deploy`
