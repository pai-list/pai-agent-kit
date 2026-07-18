import { AgentConfig, AgentState, SkillManifest } from './types';

export class Agent {
  private config: AgentConfig;
  private state: AgentState = 'idle';
  private skills: Map<string, SkillManifest> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.state = 'running';
    console.log(`[PAI] Agent ${this.config.name} started on Pi Network`);
  }

  async stop(): Promise<void> {
    this.state = 'stopped';
    console.log(`[PAI] Agent ${this.config.name} stopped`);
  }

  getState(): AgentState {
    return this.state;
  }

  registerSkill(skill: SkillManifest): void {
    this.skills.set(skill.name, skill);
  }

  listSkills(): SkillManifest[] {
    return Array.from(this.skills.values());
  }
}
