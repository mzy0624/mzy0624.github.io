import os
import time
import numpy  as np
import pandas as pd

class Common:
    def __init__(self, env, alpha=0.5, gamma=0.95, episodes=100, max_epsilon=1, min_epsilon=0.05, epsilon_decay_rate=0.005):
        self.env = env
        self.alpha = alpha
        self.gamma = gamma
        self.episodes = episodes
        self.epsilon = max_epsilon
        self.max_epsilon = max_epsilon
        self.min_epsilon = min_epsilon
        self.epsilon_decay_rate = epsilon_decay_rate
        self.n_state = env.observation_space.n  # the number of states
        self.n_action = env.action_space.n      # the number of actions
        self.Q_path = f'./Q-{self.n_state}X{self.n_action}.csv'
        self.trained = os.path.exists(self.Q_path)
        if self.trained:
            dtype = dict(zip(
                np.array(list(map(str, range(self.n_action)))), 
                np.array(['float64'] * self.n_action)
            ))
            self.Q = pd.read_csv(self.Q_path, header=0, dtype=dtype)
        else:
            self.Q = pd.DataFrame(
                np.zeros((self.n_state, self.n_action)),
                index=np.arange(self.n_state),
                columns=np.arange(self.n_action)
            )
    
    def update_epsilon(self, episode):
        self.epsilon = self.min_epsilon + (self.max_epsilon - self.min_epsilon) * np.exp(-self.epsilon_decay_rate * episode)
        
    def epsilon_greedy(self, state):
        if np.random.uniform() < self.epsilon or (self.Q.iloc[state] == 0).all():
            return self.env.action_space.sample()   # random
        return self.Q.iloc[state].idxmax()  # greedy
    
    def select_action(self, state):
        return self.epsilon_greedy(state)
    
    def update_Q(self, state, action, reward, next_state, next_action=None):
        pass
    
    def save_Q(self):
        self.trained = True
        self.Q.to_csv(self.Q_path, index=False)

    def train(self):
        pass
        
    def play(self):
        state, info = self.env.reset()
        done = False
        while not done:
            action = self.select_action(state)
            next_state, reward, terminated, truncated, info = self.env.step(int(action))
            done = terminated or truncated
            state = next_state
            time.sleep(0.1)
