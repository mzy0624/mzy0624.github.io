import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import gym
import os
from itertools import count

class Network(nn.Module):
    def __init__(self, n_state, n_action):
        super().__init__()
        self.fc1 = nn.Linear(n_state, 36)
        self.fc2 = nn.Linear(36, 36)
        self.fc3 = nn.Linear(36, n_action)
    
    def forward(self, state):
        x = state
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class DQN:
    def __init__(self, env, alpha=0.001, gamma=0.95, episodes=1000, max_epsilon=1, min_epsilon=0.05, epsilon_decay_rate=0.005):
        self.env = env
        self.alpha = alpha
        self.gamma = gamma
        self.episodes = episodes
        self.epsilon = max_epsilon
        self.max_epsilon = max_epsilon
        self.min_epsilon = min_epsilon
        self.epsilon_decay_rate = epsilon_decay_rate
        self.n_state = env.observation_space.n
        self.n_action = env.action_space.n
        self.Q_Net = Network(self.n_state, self.n_action)
        self.load_model()
        self.optimizer = optim.Adam(self.Q_Net.parameters(), lr=self.alpha)
        self.criterion = nn.MSELoss()

    def save_model(self, model_path='./Q.bin'):
        torch.save(self.Q_Net.state_dict(), model_path)
        
    def load_model(self, model_path='./Q.bin'):
        if os.path.exists(model_path):
            self.Q_Net.load_state_dict(torch.load(model_path))

    def update_epsilon(self, episode):
        self.epsilon = self.min_epsilon + (self.max_epsilon - self.min_epsilon) * np.exp(-self.epsilon_decay_rate * episode)

    def epsilon_greedy(self, state):
        if np.random.uniform() < self.epsilon:
            return self.env.action_space.sample()
        with torch.no_grad():
            state = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            q_values = self.Q_Net(state)
            return q_values.max(1)[1].item()

    def one_hot_encode(self, state):
        one_hot = np.zeros(self.n_state)
        one_hot[state] = 1
        return one_hot
    
    def select_action(self, state):
        return self.epsilon_greedy(self.one_hot_encode(state))

    def update_Q(self, state, action, reward, next_state, done):
        state      = torch.tensor(self.one_hot_encode(state),      dtype=torch.float32).unsqueeze(0)
        next_state = torch.tensor(self.one_hot_encode(next_state), dtype=torch.float32).unsqueeze(0)
        reward     = torch.tensor([reward],                        dtype=torch.float32)
        action     = torch.tensor([[action]],                      dtype=torch.int64)
        
        q_values = self.Q_Net(state)
        next_q_values = self.Q_Net(next_state)
        target = reward + (1 - done) * self.gamma * next_q_values.max(1)[0]
        target_f = q_values.clone()
        target_f[0][action] = target
        
        loss = self.criterion(q_values, target_f)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
    def train(self):
        for episode in range(self.episodes):
            state, info = self.env.reset()
            total_reward = 0
            for t in count():
                action = self.select_action(state)
                next_state, reward, terminated, truncated, info = self.env.step(action)
                done = terminated or truncated
                if done and reward == 0:
                    reward = -(t ** 0.5)
                self.update_Q(state, action, reward, next_state, done)
                state = next_state
                total_reward += reward
                
                if done:
                    self.update_epsilon(episode)
                    if reward > 0:
                        print(f'{episode = }, {t = }')
                        self.save_model()
                    break
    
    def play(self):
        state, info = self.env.reset()
        done = False
        while not done:
            action = self.select_action(state)
            next_state, reward, terminated, truncated, info = self.env.step(action)
            done = terminated or truncated
            state = next_state
            time.sleep(0.01)

if __name__ == '__main__':
    env = gym.make('FrozenLake-v1', desc=None, map_name='4x4', is_slippery=False, render_mode="human")
    agent = DQN(env)
    try:
        agent.train()
    except KeyboardInterrupt:
        pass
    input('Trained')
    agent.play()
    input()