---
title: Webhooks(Contact-Center)
display_title: Webhooks
canonical_url: https://developer.webex.com/docs/api/guides/webhooks-cc
content_type: documentation
product_group:
- webex-contact-center
categories:
- webex-contact-center
---

> Official Webex documentation: [View this page on Webex for Developers](https://developer.webex.com/docs/api/guides/webhooks-cc)

Contact Center Webhooks

# Using Webhooks

Webhooks enable you to receive notifications and react to events occurring within Webex Contact Center.
Use the [Subscriptions API](https://developer.webex.com/webex-contact-center/docs/api/v1/subscriptions) to subscribe to these Webhooks.

## Use Cases

Webhooks form a great system for working with near-real-time data, and for reacting to Contact Center events using custom logic. If you want to stay on top of a busy contact center, or have an application which can’t wait for slow batch reports or expensive API polling-and-diffing solutions, then you're in the right place.

## Design Considerations

As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. For this reason, **integrations should not rely solely on webhooks** to synchronize with Webex Contact Center. For this reason, we aim to quickly deliver webhooks over delivering all webhooks. The best practice is to implement a reconciliation job using our APIs and run it occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.

Furthermore, since webhooks are delivered via HTTP, **we cannot guarantee that webhooks would arrive in order**. This often complicates stateful calculations. Therefore, build your system/logic accordingly.

Lastly, **webhooks may be delivered multiple times**. Build your system/logic accordingly.


## Agents

The agent resource encapsulates the entities which handle the tasks through interactions with customers. An agent can be either a human or bot, and can be either the entity directly handling the task, or an assisting entity i.e. a supervisor. Agents are summarized by the groups they belong to (organization and team), details for the tasks they handle, and their overall availability. The difference in duration between the from and to dates cannot be more than 1
day.


<div style="border-radius: 8px; padding: 12px; margin: 12px 0; background: #f7f7f7;">
    <h4>Agent Login</h4>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background-color: #16a693; color: white;padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
        <code>agent:login</code>
    </div>
    <p><strong>Resource Version: agent:1.0.0, agent:2.0.0</strong></p>
    <p>An event indicating that an Agent has logged in.</p>
     <p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best practice is to implement a reconciliation job using the <a href="https://developer.webex.com/webex-contact-center/docs/api/v1/agents/buddy-agents-list">Get Agent Activities API</a> and run it occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"agent:login"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbfkWZ331_GLMMoS3N"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**agentId (string)**
The ID associated with the agent who logged in.
Example: **"8e18afd-db79-449b-b4f5-ae4f1d49f45e"**

**destination (string)**
The phone number that is associated with the agent.
Example: **"31476521"**

**profileType (string)**
The multimedia profile type of the agent. Can be Blended, Blended Real-time, or Exclusive.
Example: **"BLENDED"**

**idleCodeId (string)**
The idle code of the agent when logged in.
Example: **"5"**

**currentState (string)**
The current state that the agent is in.
Example: **"Idle"**

**createdTime (integer)**
The time that the login event occurred in epoch milliseconds.
Example: **160269666391**

**teamId (string)**
The ID associated with an agent’s team.
Example: **"3ce57020-dfd7-47fd-91a1-2783bf4a08e5"**
</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 12px; margin: 12px 0; background: #f7f7f7;">
    <h4>Agent Logout</h4>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
        <code>agent:logout</code>
    </div>
    <p><strong>Resource Version: agent:1.0.0, agent:2.0.0</strong></p>
    <p>An event indicating that an Agent has logged out.</p>
    <p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best practice is to implement a reconciliation job using the <a href="#">Get Agent Activities API</a> and run it occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"4967b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"agent:logout"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbfkWZ331_GLMMoS3N"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**agentId (string)**
The ID associated with the agent who logged out.
Example: **"8e18afd-db79-449b-b4f5-ee4f14d9f45e"**

**currentState (string)**
The current state that the agent is in.
Example: **"logged-out"**

**loggedOutBy (string)**
The mechanism used to log the agent out.
Example: **"SELF"**

**createdTime (integer)**
The time that the logout event occurred in epoch milliseconds.
Example: **160269666391**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
    <h4>Agent State Change</h4>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span
            style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
        <code>agent:state_change</code>
    </div>
    <p><strong>Resource Version: agent:1.0.0</strong></p>
    <p>An event indicating that an Agent’s state has changed.</p>
    <p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best
        practice is to implement a reconciliation job using the <a href="#">Get Agent Activities API</a> and run it
        occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br />

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"4967b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"agent:state_change"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbfkWZ331_GLMMoS3N"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br />

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**agentId (string)**
The ID associated with the agent who is handling the contact.
Example: **"8e18afd-db79-449b-b4f5-ee4f14d9f45e"**

**currentState (string)**
The current state of the agent. Can be idle, available, ringing, not-responding, connected, on-hold,
hold-done, consulting, conferencing, consult-done, wrapup, wrapup-done.
Example: **"idle"**

**destination (string)**
The phone number that is associated with the agent.
Example: **"9900163437"**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXlp8E3f-KJXJ6KOPIK"**

**taskId (string)**
The ID associated with a specific interaction.
Example: **"40fa44a7-b640-4b72-a8cd-5a0502ab2e81"**

**createdTime (integer)**
The time that the state_change event occurred in epoch milliseconds.
Example: **160269666391**

**idleCodeId (string)**
The idle code of the agent when currentState is idle.
Example: **"2651"**

**connectedChannels (string[])**
List of channels that agent is currently handling.
Example: **["4fae000e-f460-4b5c-8b05-02f7fb5a8061", "4fae000e-fabb-4"]**

**wrapUpAuxCodeId (string)**
The wrapup code the agent selects when ending a task.
Example: **"3183"**

**teamId (string)**
The ID associated with an agent’s team.
Example: **"3ce57020-dfd7-47fd-91a1-2783bf4a08e5"**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
    <h4>Agent Channel State Change</h4>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span
            style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
        <code>agent:channel_state_change</code>
    </div>
    <p><strong>Resource Version: agent:2.0.0</strong></p>
    <p>This event indicates that an agent's state has changed at the channel level. It is available under resource version agent:2.0.0.</p>
    <p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best
        practice is to implement a reconciliation job using the <a href="#">Get Agent Activities API</a> and run it
        occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br />

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"4967b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"agent:channel_state_change"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbfkWZ331_GLMMoS3N"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br />

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**agentId (string)**
The ID associated with the agent who is handling the contact.
Example: **"8e18afd-db79-449b-b4f5-ee4f14d9f45e"**

**currentState (string)**
The current state of the agent. Can be idle, available, ringing, not-responding, connected, on-hold,
hold-done, consulting, conferencing, consult-done, conference-done, wrapup, wrapup-done.
Example: **"idle"**

**channelId (string)**
The ID of the channel associated with the agent.
Example: **"bc7eedd6-42c6-45c5-9c94-2d34123317e6"**

**channelType (string)**
The type of channel associated with the agent.
Example: **"telephony"**

**destination (string)**
The phone number that is associated with the agent.
Example: **"9900163437"**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXlp8E3f-KJXJ6KOPIK"**

**taskId (string)**
The ID associated with a specific interaction.
Example: **"40fa44a7-b640-4b72-a8cd-5a0502ab2e81"**

**createdTime (integer)**
The time that the state_change event occurred in epoch milliseconds.
Example: **160269666391**

**idleCodeId (string)**
The idle code of the agent when currentState is idle.
Example: **"2651"**

**wrapUpAuxCodeId (string)**
The wrapup code the agent selects when ending a task.
Example: **"3183"**

**teamId (string)**
The ID associated with an agent's team.
Example: **"3ce57020-dfd7-47fd-91a1-2783bf4a08e5"**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
    <h4>Agent ChannelType State Change</h4>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span
            style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
        <code>agent:channelType_state_change</code>
    </div>
    <p><strong>Resource Version: agent:2.0.0</strong></p>
    <p>An event indicating that an Agent's state has changed for a specific channel type. This event is fired when an agent's availability or engagement state transitions within a particular media channel (e.g., telephony, chat, email, or social).</p>
    <p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP.</p>

<br />

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"e4bf8529-a418-424e-8c17-89ddbbe22b36"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"agent:channelType_state_change"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/acec9408-7145-4d0e-84fc-3c5341d5d23b"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"e19d4bfb-30aa-4a7c-a245-3c029178cc69"**

**comciscotimestamp (string)**
The timestamp at which the event was produced, in epoch milliseconds.
Example: **"1768319369101"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br />

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**agentId (string)**
The ID associated with the agent whose channel type state has changed.
Example: **"11bafc46-ae09-4ddf-bf0b-26d24e924f9f"**

**currentState (string)**
The current state of the agent for the given channel type. Valid agent states are:
- **Available** — The agent is available in this channel type and can accept a contact.
- **Idle** — The agent is currently logged in but not available in this channel type and cannot take contacts. This would be shown on the desktop by the Aux code selected (e.g., lunch).
- **Engaged** — The agent is actively working on one or more contacts in this channel type.
- **EngagedOther** — The agent is engaged with a channel type that, due to "Exclusive" or "Blended Realtime" multimedia profile settings, prevents them from accepting a contact in this channel type. For example, if an agent with an Exclusive profile is engaged on an email, they would be "EngagedOther" in Voice, Chat, and Social. Similarly, with a Blended Realtime profile, if the agent is engaged on a Chat contact, they would be "EngagedOther" in the Voice channel type.
- **WrapUp** — The agent is currently performing wrap-up work on a contact and will transition to Available at conclusion if not working on another contact in that channel type.
- **Reserved** — The agent has been selected by routing and is in the process of being invited (inbound or outbound). This state is typically short-lived. For cases where a campaign agent is reserved with a reservation call, their state will be Reserved in the voice channel as opposed to Engaged.
- **LoggedOut** — Although technically not a managed agent state, this indicates the agent is not logged into the system.
  Example: **"Available"**

**channelType (string)**
The channel type of the agent for which the state change applies. Can be set to telephony, social, email, or chat. A separate agent:channelType_state_change event is sent per channel type. In the event that the agent is setting more than one channel type state at once, multiple state change events are sent — one per channel type.
Example: **"social"**

**pendingIdleState (boolean)**
Indicates whether the agent has a pending idle state. The value is determined by the following conditions: first, the agent's sub_status must be set to idle (the agent has indicated they want to go idle). If not, pendingIdleState is **false**. Next, the agent's state in the current channel must not yet be idle (e.g., the agent is still Engaged or in WrapUp). If the agent's state in the channel is already idle, pendingIdleState is **false**. Finally, if not all channels in the channelType are idle, then pendingIdleState is **true** — otherwise it is **false**. When **true**, the agent is currently working or wrapping up one or more contacts and will transition to Idle at the conclusion. No further contacts will be given to them in that channel type. On the desktop, the output will reflect the selected Aux code (e.g., "Pending Coffee-Break").
Note: In non-voice channels, it is possible to directly set the agent state to Idle although one or more channels are active in a media type.
Example: **false**

**idleCodeName (string)**
The name of the idle (auxiliary) code selected by the agent. This field is populated when the agent's current state is Idle, or when pendingIdleState is true (the agent has selected an idle code but has not yet transitioned). Examples include "Meeting", "Lunch", or "Break".
Example: **"Meeting"**

**teamId (string)**
The ID associated with an agent's team.
Example: **"088ca4da-085c-4563-9b71-d430721f0354"**

**createdTime (integer)**
The time that the channelType_state_change event occurred, in epoch milliseconds.
Example: **1768319367741**

</div>
</div>
</details>
</div>

## Captures
The Capture resource is a snippet of media. Specifically, Captures are the recorded pieces of media produced from a Task. Supported channels are Voice, Chat, Email & Social (as applicable for the solution). There can be one or many Captures for any given Task. Captures are accessible for both open (voice only) and closed Tasks (all channels). Requires one of the following scopes cjp:config_read, cjp-analyzer:read.

The existing `capture:available` webhook remains backward-compatible and continues to indicate recording availability. In addition, explicit `recording:available` and `transcription:available` webhook events are available for integrations that want separate recording and transcript readiness signals.

Use these events as follows:

- Subscribe to `capture:available` if your integration already relies on the existing recording-ready webhook behavior.
- Subscribe to `recording:available` if you want an explicit recording-ready signal while preserving the same general payload shape as `capture:available`.
- Subscribe to `transcription:available` if you want an explicit transcript-ready signal.
- Subscribe to more than one of these events if your integration needs both recording and transcript readiness.

When the beta additive events are enabled for your organization for voice interactions:

- `capture:available` and `recording:available` are both delivered for recording readiness
- the two events fan out from the same internal recording-available signal and therefore share the same event `id`
- `capture:available` keeps the existing payload shape
- `recording:available` adds the `contactType` field

For transcript availability, integrations should use `transcription:available` for both voice and digital interactions. Digital interactions do not emit recording-oriented webhook events for transcript readiness.

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Capture Available</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>capture:available</code>
</div>
<p><strong>Resource Version: capture:1.0.0</strong></p>
<p>An event indicating that the recording for a call is available after the call has ended.</p>
<p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best practice is to implement a reconciliation job using the <a href="#">Search API</a> and then use the results in a subsequent request to the <a href="#">List Captures API</a>. Run this occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"4967b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"capture:available"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbFkWZ331_GLMMoS3N"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The task ID associated with the capture.
Example: **"8e18afdf-db79-449b-b4f5-ee4f14d9f45e"**

**filePath (string)**
The file path of the recording.
Example: **"https://api.wxcc-us1.ciscoccservice.com/v1/captures/query"**

**createdTime (integer)**
The time that the capture event occurred in epoch milliseconds.
Example: **160266966391**

</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Recording Available</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>recording:available</code>
</div>
<p><strong>Resource Version: recording:1.0.0</strong></p>
<p>An event indicating that the recording for an interaction is available. This event is additive to <code>capture:available</code> and uses the same general payload structure with an additional <code>contactType</code> field.</p>
<p>When the beta additive events are enabled for your organization, a recording-ready voice interaction emits both <code>capture:available</code> and <code>recording:available</code>. These two events share the same event <code>id</code> because they fan out from the same internal recording-ready signal.</p>
<p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best practice is to implement a reconciliation job using the <a href="#">Search API</a> and then use the results in a subsequent request to the <a href="#">List Captures API</a>. Run this occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"e282a9b6-37e9-4460-8cdd-1a1f1036943a"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"recording:available"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/c0d47eb3-d679-4648-8448-94b52e46de7e"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"bb275007-7d49-4fa0-8f84-73e49e44432f"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The task ID associated with the recording.
Example: **"e7506dab-4430-4d1b-8834-e994c9862eed"**

**filePath (string)**
The Captures API path that the integration should use to retrieve the available recording details for the task.
Example: **"https://api.intgus1.ciscoccservice.com/v1/captures/query"**

**contactType (string)**
The media family for which the recording is available.
Example: **"telephony"**

**createdTime (integer)**
The time that the recording event occurred in epoch milliseconds.
Example: **1781593896741**

</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Transcription Available</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>transcription:available</code>
</div>
<p><strong>Resource Version: transcription:1.0.0</strong></p>
<p>An event indicating that the transcript for an interaction is available. This event is additive and does not change the existing meaning of <code>capture:available</code>.</p>
<p>For voice and digital interactions, more than one <code>transcription:available</code> event can be delivered if more than one transcript artifact becomes available for the same task.</p>
<p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. The best practice is to implement a reconciliation job using the <a href="#">Search API</a> and then use the results in a subsequent request to the <a href="#">List Captures API</a>. Run this occasionally (say, nightly) to synchronize all activities that occurred since the last reconciliation.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"c0c0f912-5f25-45a8-85a9-5a48dbd69cc5"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"transcription:available"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/f77ab22f-dbce-4235-ba9c-87cab24c9223"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"bb275007-7d49-4fa0-8f84-73e49e44432f"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The task ID associated with the transcript.
Example: **"e7506dab-4430-4d1b-8834-e994c9862eed"**

**filePath (string)**
The Captures API path that the integration should use to retrieve the available transcript details for the task.
Example: **"https://api.intgus1.ciscoccservice.com/v1/captures/query"**

**contactType (string)**
The media family for which the transcript is available. This is `telephony` for voice transcripts and can be a digital channel family or admin-configured digital channel value for digital transcripts.
Example: **"telephony"**

**createdTime (integer)**
The time that the transcript event occurred in epoch milliseconds.
Example: **1781594954447**

</div>
</div>
</details>
</div>


## Tasks

The task resource represents a request or demand for work from agents. Concretely, a telephony task is an incoming call. Tasks are not considered complete until all parties have wrapped up, i.e., the customer has terminated communication and the agent has completed any summary/“wrap-up” work. Tasks are most commonly initiated by the customer (inbound), but can also be initiated by an agent (outbound). Presently, Task APIs are supported for telephony media only.

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Conference Done</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>conference-done</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a conference with another Agent and Customer is completed. However, the task is still in progress with the Customer.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:conference-done"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Conferencing</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:conferencing</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is being conferenced with another Agent as well as the Customer.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:conferencing"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Connect</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:connect</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is routed to an agent, and the agent has yet to accept the work.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:connect"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Connected</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:connected</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task has been successfully accepted by the Agent.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:connected"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Consult Done</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:consult-done</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a consult with another Agent is completed, while the Customer is currently on hold.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:consult-done"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Consulting</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:consulting</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is being consulted with another Agent, while the Customer is currently on hold.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:consulting"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Ended</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:ended</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task has ended either by the Agent or by the Customer.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:ended"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social|workItem|customMessaging"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**terminatingParty (string)**
Indicates which party ended the task.
Can be an Agent or a Customer.
Example: **"Customer|Agent"**

**reason (string)**
Indicates the cause for a task to end.
Example: **"Agent left|Customer left"**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Failed</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:failed</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task operation has failed in the contact center.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:failed"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{taskId}"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with the task operation. Use this value for correlation with related task operations and events.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string, optional)**
Customer endpoint address.
- For telephony, this is the phone number.
- For email, this is the email address.
- For social, this is the customer's social identifier.
- For workItem, this is the customer identifier.
- For customMessaging, this is the customer identifier from the external messaging channel.
Example: **"customer@example.com"**

**destination (string, optional)**
Customer care endpoint address.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
- For workItem, this is the business address configured on the Work Item asset.
- For customMessaging, this is the business address configured on the Custom Messaging asset.
Example: **"support@channel.biz"**

**direction (string, optional)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
Example: **"INBOUND"**

**channelType (string, optional)**
The media type of the task.
Example: **"chat|email|social|workitem|customMessaging"**

**mediaMgr (string)**
The name of the media manager responsible for handling the task.
Example: **"digitalmm"**

**mediaChannel (string, optional)**
The specific media channel within the media type.
Example: **"facebook"**

**mediaResourceId (string, optional)**
The media resource identifier associated with the task, if applicable.
Example: **"e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6789"**

**fcScriptId (string, optional)**
The entry point ID associated with the task's flow control script.
Example: **"AXCLfX19Id7K1N9hMlfR"**

**reason (string, optional)**
Partner-visible failure reason. Treat this as a representative runtime value, not as an exhaustive list.
Example: **"CONVERSATION_ALREADY_OPEN"**

**errorMessage (string, optional)**
Human-readable error message returned for the failure. This should be treated as representative and may vary by failure path.
Example: **"Conversation is already open with task id ab4ea619-a1ad-33a3-aed9-c2563a9bd6cc"**

**failureType (string, optional)**
Failure state published for the task.
Example: **"failed"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Message Appended</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task-message:appended</code>
</div>
<p><strong>Resource Version: task-message:1.0.0</strong></p>
<p>An event indicating that an inbound message has been successfully appended to a task's conversation. This section documents the subscription webhook for inbound task-message flows. Outbound asset-configured partner webhooks are documented separately in the Bring Your Own Custom Messaging Channel guide.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task-message:appended"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with the task to which the message was appended.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**direction (string, optional)**
Direction of the overall task.
Example: **"INBOUND"**

**messageDirection (string)**
Direction of the appended message. For this subscription webhook, the common value is `INBOUND`.
Example: **"INBOUND"**

**channelType (string, optional)**
The channel type of the task.
Example: **"customMessaging"**

**channel (string, optional)**
Configured channel name for the task when available.
Example: **"my-custom-channel"**

**origin (string, optional)**
Customer identifier associated with the task when available.
Example: **"customer@example.com"**

**destination (string, optional)**
Business address associated with the task when available.
Example: **"support@channel.biz"**

**createdTime (integer, optional)**
Message creation time in epoch milliseconds.
Example: **1780295173809**

**eventDetails (string, optional)**
Partner-visible status details for successful append processing.
Example: **"Appended Message to chat successfully."**

**channelParams (object, optional)**
Appended message payload. This typically includes the message `type`, nested message `aliasId`, `text`, optional `attachments`, and `timestamp`.
Example: **Custom Messaging message payload**

**reason (string, optional)**
Usually `null` for success payloads.
Example: **null**

**errorMessage (string, optional)**
Usually `null` for success payloads.
Example: **null**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Message Append Failed</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task-message:append-failed</code>
</div>
<p><strong>Resource Version: task-message:1.0.0</strong></p>
<p>An event indicating that an inbound message failed to be appended to a task's conversation. This event applies to inbound subscription webhook flows only.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task-message:append-failed"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b64f08"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with the task for which the append operation failed.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**direction (string, optional)**
Direction of the overall task when the task context is available.
Example: **"INBOUND"**

**messageDirection (string)**
Direction of the message that failed to append.
Example: **"INBOUND"**

**channelType (string, optional)**
The channel type of the task when available.
Example: **"customMessaging"**

**channel (string, optional)**
Configured channel name when available.
Example: **"my-custom-channel"**

**origin (string, optional)**
Customer identifier when available.
Example: **"customer@example.com"**

**destination (string, optional)**
Business address when available.
Example: **"support@channel.biz"**

**createdTime (integer, optional)**
Message creation time in epoch milliseconds when available.
Example: **1780300207453**

**channelParams (object, optional)**
Message payload when available. This may be absent in some failure paths.
Example: **Custom Messaging message payload**

**reason (string, optional)**
Partner-visible failure reason. Treat documented values as representative, not exhaustive.
Example: **"INVALID_CONTENT"**

**errorMessage (string, optional)**
Human-readable failure detail.
Example: **"The maximum number of attachments allowed is 1."**

</div>
</div>

<p>Common inbound append failure categories include <code>NOT_FOUND</code>, <code>INVALID_CONTENT</code>, and <code>INTERNAL_ERROR</code>.</p>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Hold Done</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:hold-done</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is currently resumed by the Agent.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:hold-done"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task New</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:new</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is formed.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:new"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-fiad-45a1-9d8c-2f66e3b6408"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social|workItem|customMessaging"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task On Hold</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:on-hold</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is currently on hold since the Agent has placed the Customer on hold.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:on-hold"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O14n5KIbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Parked</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>task:parked</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is queued because no agents are currently available to handle the task.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:parked"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/AXXbfkWZ331_GLMMoS3N"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"9dcb8657-ffad-45a1-9d8c-2f66e3b640f8"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1OI4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **1602696696391**

</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Conference Transferred</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>conference-transferred</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a conference is transferred from one Agent to Another Agent. However, the task is still in progress with the Customer.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:conference-transferred"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**outboundType (string)**
Indicates if the outbound task was an autodial, campaign, or callback.
Example: **null**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1OI4n5kITbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **1602696696391**

</div>
</div>
</details>
</div>

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Task Origin Updated</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
    <code>task:origin-updated</code>
</div>
<p><strong>Resource Version: task:1.0.0</strong></p>
<p>An event indicating that a task is updated with a new caller origin</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the task.
Example: **"49670b0ec-1fd2-4863-8a9f-68224628d52d"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name that identifies the event.
Example: **"task:origin-updated"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/{subscriptionId}"**

**comciscocorgid (string)**
Organization ID to which the event belongs.
Example: **"orgId"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**taskId (string)**
The ID associated with a specific interaction.
Example: **"888b688e-b74e-4fa6-8260-1e8d0a3523a"**

**origin (string)**
Customer’s channel-specific identifier.
- For telephony, this is the phone number.
- For email and chat, this is the email address.
  Example: **"1+9****8095"**

**destination (string)**
Destination the customer contacted.
- For telephony, this is the number the customer called.
- For chat, this is the chat template name where the chat takes place.
- For email, it is the email address contacted.
  Example: **"1+5****2001"**

**direction (string)**
Indicates which party initiated the Task.
- If **"INBOUND"**, it was initiated by the customer.
- If **"OUTBOUND"**, it was initiated by the system or an agent.
  Example: **"INBOUND"**

**channelType (string)**
Indicates the channel type of a task.
Example: **"telephony|chat|email|social"**

**queueId (string)**
The ID associated with an agent queue.
Example: **"AXbm0MeV1O14n5KIbT6"**

**createdTime (integer)**
The time at which the event occurred in epoch milliseconds.
Example: **160269663691**

</div>
</div>
</details>
</div>


## Flows

The flow resource represents a published Webex Contact Center Flow Designer execution. A flow defines the routing and orchestration logic that runs for a customer interaction, including IVR prompts, queueing decisions, data dips, virtual agent steps, event handling, and downstream routing actions.

Flow webhooks provide observability events for flow execution outcomes. The `flow:error` webhook is sent when a flow encounters an error during execution. This event is designed for failure scenarios and helps administrators and developers monitor failed flow executions, investigate issues faster, and take action when a flow fails.

The `flow:error` webhook delivers targeted error observability data that can be sent to platforms such as Splunk or other third-party analytics and observability solutions. It is not intended to stream all flow debug or execution data. Use this webhook to monitor actionable flow failures in near real time and to trigger downstream alerting, investigation, or automation workflows.

Customers can manage HTTPS webhook collector URLs in **Developer Portal > Webhooks** to support secure delivery of flow error events to external observability platforms.

<div style="border-radius: 8px; padding: 16px; margin: 12px 0; background: #f7f7f7;">
<h4>Flow Error</h4>
<div style="display: flex; align-items: center; gap: 8px;">
<span style="background-color: #16a693; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">EVENT</span>
<code>flow:error</code>
</div>
<p><strong>Resource Version: flow:1.0.0</strong></p>
<p>An event indicating that a Flow Designer flow encountered an error during execution.</p>
<p>Use this event to observe failed flow executions, correlate failures to affected interactions, and route failure details into external observability tools. This event is emitted only for flow failure scenarios and does not include complete flow debug traces or all activity-level execution data.</p>
<p>As with all webhook systems, HTTP webhook delivery is not always guaranteed, due to the nature of HTTP. Webhook events may arrive more than once or out of order. Build your system/logic accordingly.</p>

<br/>

<details>
<summary style="cursor: pointer;">
🔍 Click to see Event Payload details.
</summary>

**Event Payload**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #ededed;">

**id (string)**
The ID of the event.
Example: **"c86204c6-6c11-4c8d-b7de-7e14bbb33887"**

**specversion (string)**
The Cloud Events version.
Example: **"1.0"**

**type (string)**
Unique name which identifies the event.
Example: **"flow:error"**

**source (string)**
Where the event originated from.
Example: **"/com/cisco/wxcc/e874fa9a-b649-49e8-a7db-ae1502c74b96"**

**comciscoorgid (string)**
Organization ID to which the event belongs.
Example: **"250d7efb-1e6d-4b99-9eab-98f748c9c0f1"**

**comciscotimestamp (string)**
The timestamp at which the event was produced, in epoch milliseconds.
Example: **"1750855852491"**

**datacontenttype (string)**
Content type of the event.
Example: **"application/json"**

<br/>

**Data Object**

<div style="border-radius: 8px; padding: 12px; margin: 12px 0 0 0; background: #e1e1e1;">

**interactionId (string)**
The ID associated with the interaction in which the flow error occurred.
Example: **"44af0d2a-2ef4-4049-a402-e41939d72f4d"**

**flowId (string)**
The ID associated with the flow that encountered the error.
Example: **"684a72233daf36734cb5c499"**

**flowVersionId (string)**
The ID associated with the published flow version that was executing when the error occurred.
Example: **"68510a9f3daf36734cb5c72b"**

**tagName (string)**
The flow tag associated with the executing flow version.
Example: **"Latest"**

**activityName (string)**
The name of the Flow Designer activity where the error occurred.
Example: **"GetQueueInfo_hdt"**

**startTime (integer)**
The time at which the failed activity started, in epoch milliseconds.
Example: **1750855852249**

**endTime (integer)**
The time at which the failed activity ended, in epoch milliseconds.
Example: **1750855852376**

**status (string)**
The flow execution status for this event.
Example: **"error"**

**statusDescription (string)**
The description or reason associated with the error status.
Example: **"INSUFFICIENT_DATA"**

**debugUrl (string)**
The URL that can be used to open the failed interaction in Flow Designer debug mode.
Example: **"https://flow-control.prodjp1.ciscoccservice.com/flow/{flowId}/debug/{interactionId}?orgId={orgId}&version={flowVersionId}"**

**createdTime (integer)**
The time at which the flow error event was created, in epoch milliseconds.
Example: **1750855852391**

</div>
</div>
</details>
</div>
