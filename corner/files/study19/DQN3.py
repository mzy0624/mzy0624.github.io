import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import gym
import os
from collections import deque
from itertools import count
import random
from DQN2 import DQN2

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

class ReplayBuffer:
    def __init__(self, capacity):
        self.buffer = deque(maxlen=capacity)
    
    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size):
        state, action, reward, next_state, done = zip(*random.sample(self.buffer, batch_size))
        return state, action, reward, next_state, done
    
    def __len__(self):
        return len(self.buffer)

class DQN3(DQN2):
    def __init__(self, env, alpha=0.001, gamma=0.95, episodes=1000, max_epsilon=1, min_epsilon=0.05, epsilon_decay_rate=0.005, buffer_capacity=10000, batch_size=32, target_update=10):
        super().__init__(env, alpha, gamma, episodes, max_epsilon, min_epsilon, epsilon_decay_rate, buffer_capacity, batch_size)
        self.Q_Target = Network(self.n_state, self.n_action)
        self.target_update = target_update
        self.update_target()

    def load_model(self, model_path='./Q.bin'):
        if os.path.exists(model_path):
            self.Q_Net.load_state_dict(torch.load(model_path))
        self.update_target()

    def update_target(self):
        self.Q_Target.load_state_dict(self.Q_Net.state_dict())

    def update_Q(self):
        if len(self.buffer) < self.batch_size:
            return
        
        state, action, reward, next_state, done = self.buffer.sample(self.batch_size)
        state      = torch.tensor(state,      dtype=torch.float32)
        next_state = torch.tensor(next_state, dtype=torch.float32)
        reward     = torch.tensor(reward,     dtype=torch.float32)
        action     = torch.tensor(action,     dtype=torch.int64).unsqueeze(1)
        done       = torch.tensor(done,       dtype=torch.float32)
        
        q_values = self.Q_Net(state).gather(1, action)
        next_q_values = self.Q_Target(next_state).max(1)[0]
        target = reward + (1 - done) * self.gamma * next_q_values
        target = target.unsqueeze(1)
        
        loss = self.criterion(q_values, target)
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
                self.buffer.push(self.one_hot_encode(state), action, reward, self.one_hot_encode(next_state), done)
                self.update_Q()
                state = next_state
                total_reward += reward
                
                if done:
                    self.update_epsilon(episode)
                    if reward > 0:
                        print(f'{episode = }, {t = }')
                        self.save_model()
                    break
                
                if episode % self.target_update == 0:
                    self.update_target()  # Update the target network periodically
    
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
    agent = DQN3(env)
    try:
        agent.train()
    except KeyboardInterrupt:
        pass
    input('Trained')
    agent.play()
    input()
