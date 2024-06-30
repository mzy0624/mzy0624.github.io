from itertools import count
import gym
from Common import Common

class SARSA(Common):
    def __init__(self, env, alpha=0.5, gamma=0.95, episodes=100, max_epsilon=1, min_epsilon=0.05, epsilon_decay_rate=0.005):
        super().__init__(env, alpha, gamma, episodes, max_epsilon, min_epsilon, epsilon_decay_rate)
    
    def update_Q(self, state, action, reward, next_state, next_action=None):
        Q = self.Q.iloc[state][action]
        Q_new = Q + self.alpha * (reward + self.gamma * self.Q.iloc[next_state][next_action] - Q)
        self.Q.iloc[state][action] = Q_new

    def train(self):
        if self.trained:
            return
        for episode in range(self.episodes):
            state, info = self.env.reset()    # observation and information
            action = self.select_action(state)
            for t in count():
                next_state, reward, terminated, truncated, info = self.env.step(action)
                done = terminated or truncated
                next_action = self.select_action(next_state)
                if done and reward == 0:
                    reward = -1
                self.update_Q(state, action, reward, next_state, next_action)
                state, action = next_state, next_action
                
                if done:
                    self.update_epsilon(episode)
                    print(f'{episode = }, {t = }, {state = }, {action = }, {next_state = }, {terminated = }, {truncated = }, {self.epsilon = }, {info = }')
                    break        
        self.save_Q()

if __name__ == '__main__':
    env = gym.make('FrozenLake-v1', desc=None, map_name='4x4', is_slippery=False, render_mode="human")
    S = SARSA(env)
    S.train()
    S.play()
    input()