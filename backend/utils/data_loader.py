import pandas as pd
import os
import numpy as np

def load_batted_ball_data():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'BattedBallData.xlsx')
    df = pd.read_excel(file_path)

    df = df.replace({np.nan: None})
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE']).dt.date.astype(str)

    return df.to_dict(orient="records")

def load_games_by_date():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'BattedBallData.xlsx')
    df = pd.read_excel(file_path)

    df = df.replace({np.nan: None})
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE']).dt.date.astype(str)

    grouped = df.groupby('GAME_DATE')

    game_list = []
    for game_date, group_df in grouped:
        actions = group_df.to_dict(orient="records")
        game_list.append({
            "game_date": game_date,
            "actions": actions
        })

    return game_list
