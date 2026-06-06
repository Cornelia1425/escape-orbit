use spacetimedb::{Identity, ReducerContext, Table, Timestamp};

#[spacetimedb::table(accessor = player, public)]
pub struct Player {
    #[primary_key]
    pub identity: Identity,
    pub name: String,
    pub last_seen: Timestamp,
}

#[spacetimedb::table(accessor = mission, public)]
pub struct Mission {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub player_identity: Identity,
    pub player_name: String,
    pub task_text: String,
    pub started_at: Timestamp,
    pub duration_seconds: u32,
    pub status: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(accessor = event_log, public)]
pub struct EventLog {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub player_identity: Identity,
    pub player_name: String,
    pub event_type: String,
    pub message: String,
    pub created_at: Timestamp,
}

fn insert_event(
    ctx: &ReducerContext,
    player_identity: Identity,
    player_name: &str,
    event_type: &str,
    message: &str,
) {
    ctx.db.event_log().insert(EventLog {
        id: 0,
        player_identity,
        player_name: player_name.to_string(),
        event_type: event_type.to_string(),
        message: message.to_string(),
        created_at: ctx.timestamp,
    });
}

fn upsert_player(ctx: &ReducerContext, identity: Identity, name: String) {
    if let Some(mut player) = ctx.db.player().identity().find(&identity) {
        player.name = name;
        player.last_seen = ctx.timestamp;
        ctx.db.player().identity().update(player);
    } else {
        ctx.db.player().insert(Player {
            identity,
            name,
            last_seen: ctx.timestamp,
        });
    }
}

fn player_name_for(ctx: &ReducerContext, identity: Identity) -> String {
    ctx.db
        .player()
        .identity()
        .find(&identity)
        .map(|p| p.name)
        .unwrap_or_else(|| "Pilot".to_string())
}

#[spacetimedb::reducer]
pub fn join_world(ctx: &ReducerContext, name: String) -> Result<(), String> {
    let identity = ctx.sender();
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name cannot be empty".into());
    }

    upsert_player(ctx, identity, trimmed.to_string());
    insert_event(
        ctx,
        identity,
        trimmed,
        "join",
        &format!("{trimmed} entered the universe."),
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn start_mission(ctx: &ReducerContext, task_text: String, duration_seconds: u32) -> Result<(), String> {
    let identity = ctx.sender();
    let trimmed_task = task_text.trim();
    if trimmed_task.is_empty() {
        return Err("Task cannot be empty".into());
    }
    if duration_seconds == 0 {
        return Err("Duration must be greater than zero".into());
    }

    if ctx.db.player().identity().find(&identity).is_none() {
        upsert_player(ctx, identity, "Pilot".to_string());
    }

    let player_name = player_name_for(ctx, identity);

    ctx.db.mission().insert(Mission {
        id: 0,
        player_identity: identity,
        player_name: player_name.clone(),
        task_text: trimmed_task.to_string(),
        started_at: ctx.timestamp,
        duration_seconds,
        status: "flying".to_string(),
        created_at: ctx.timestamp,
    });

    insert_event(
        ctx,
        identity,
        &player_name,
        "launch",
        &format!("{player_name} launched a mission."),
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn complete_mission(ctx: &ReducerContext, mission_id: u64) -> Result<(), String> {
    let identity = ctx.sender();
    let Some(mut mission) = ctx.db.mission().id().find(&mission_id) else {
        return Err("Mission not found".into());
    };

    if mission.player_identity != identity {
        return Err("Only the mission owner can complete it".into());
    }

    mission.status = "completed".to_string();
    let player_name = mission.player_name.clone();
    ctx.db.mission().id().update(mission);

    insert_event(
        ctx,
        identity,
        &player_name,
        "complete",
        &format!("{player_name} reached a new galaxy."),
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn fail_mission(ctx: &ReducerContext, mission_id: u64) -> Result<(), String> {
    let identity = ctx.sender();
    let Some(mut mission) = ctx.db.mission().id().find(&mission_id) else {
        return Err("Mission not found".into());
    };

    if mission.player_identity != identity {
        return Err("Only the mission owner can fail it".into());
    }

    mission.status = "failed".to_string();
    let player_name = mission.player_name.clone();
    ctx.db.mission().id().update(mission);

    insert_event(
        ctx,
        identity,
        &player_name,
        "fail",
        &format!("{player_name} drifted back into orbit."),
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn heartbeat(ctx: &ReducerContext) -> Result<(), String> {
    let identity = ctx.sender();
    let Some(mut player) = ctx.db.player().identity().find(&identity) else {
        return Ok(());
    };

    player.last_seen = ctx.timestamp;
    ctx.db.player().identity().update(player);
    Ok(())
}
