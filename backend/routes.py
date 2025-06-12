from flask import Blueprint, jsonify
from utils.data_loader import load_batted_ball_data, load_games_by_date

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.route("/batted-balls", methods=["GET"])
def get_batted_balls():
    data = load_batted_ball_data()
    return jsonify(data)

@bp.route("/games", methods=["GET"])
def get_games():
    games = load_games_by_date()
    return jsonify(games)

@bp.route("/batters", methods=["GET"])
def get_batters():
    games = load_games_by_date()
    batters_dict = {}

    for game in games:
        game_date = game.get("game_date")
        for action in game.get("actions", []):
            batter_id = action.get("BATTER_ID")
            if not batter_id:
                continue

            action_with_date = action.copy()
            action_with_date["GAME_DATE"] = game_date

            if batter_id not in batters_dict:
                batters_dict[batter_id] = []

            batters_dict[batter_id].append(action_with_date)

    return jsonify(batters_dict)

@bp.route("/pitchers", methods=["GET"])
def get_pitchers():
    games = load_games_by_date()
    pitchers_dict = {}

    for game in games:
        game_date = game.get("game_date")
        for action in game.get("actions", []):
            pitcher_id = action.get("PITCHER_ID")
            if not pitcher_id:
                continue

            action_with_date = action.copy()
            action_with_date["GAME_DATE"] = game_date

            if pitcher_id not in pitchers_dict:
                pitchers_dict[pitcher_id] = []

            pitchers_dict[pitcher_id].append(action_with_date)

    return jsonify(pitchers_dict)
