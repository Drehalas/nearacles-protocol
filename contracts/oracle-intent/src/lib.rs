use near_sdk::{
    env, near, require, AccountId, Balance, Promise, Gas, NearToken,
    collections::{LookupMap, UnorderedMap, Vector},
    serde::{Deserialize, Serialize},
    json_types::{U128, U64},
    BorshDeserialize, BorshSerialize,
};
use std::collections::HashMap;

const TGAS: u64 = 1_000_000_000_000;
const MIN_STAKE: Balance = 1_000_000_000_000_000_000_000_000; // 1 NEAR
const SETTLEMENT_GAS: Gas = Gas(50 * TGAS);
const MAX_SOURCES_PER_EVALUATION: usize = 15;
const MAX_QUESTION_LENGTH: usize = 500;
const MAX_URL_LENGTH: usize = 200;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Source {
    pub title: String,
    pub url: String,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum IntentType {
    CredibilityEvaluation,
    RefutationChallenge,
    OracleSettlement,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct OracleIntent {
    pub intent_id: String,
    pub intent_type: IntentType,
    pub initiator: AccountId,
    pub question: Option<String>,
    pub evaluation_hash: Option<String>,
    pub challenge_hash: Option<String>,
    pub stake: Balance,
    pub reward: Balance,
    pub deadline: U64,
    pub status: IntentStatus,
    pub created_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum IntentStatus {
    Pending,
    InProgress,
    Completed,
    Disputed,
    Settled,
    Expired,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct OracleEvaluation {
    pub evaluation_id: String,
    pub intent_id: String,
    pub solver: AccountId,
    pub question: String,
    pub answer: bool,
    pub confidence: f64,
    pub sources: Vec<Source>,
    pub execution_time: U64,
    pub stake: Balance,
    pub status: EvaluationStatus,
    pub submitted_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum EvaluationStatus {
    Submitted,
    Verified,
    Challenged,
    Refuted,
    Confirmed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct RefutationChallenge {
    pub challenge_id: String,
    pub evaluation_id: String,
    pub challenger: AccountId,
    pub counter_sources: Vec<Source>,
    pub stake: Balance,
    pub status: ChallengeStatus,
    pub submitted_at: U64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum ChallengeStatus {
    Submitted,
    UnderReview,
    Successful,
    Failed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OracleSolver {
    pub solver_id: AccountId,
    pub reputation_score: f64,
    pub total_evaluations: u64,
    pub successful_evaluations: u64,
    pub total_stake: Balance,
    pub is_active: bool,
    pub performance_metrics: SolverPerformanceMetrics,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SolverPerformanceMetrics {
    pub average_execution_time: f64, // milliseconds
    pub average_confidence_score: f64,
    pub total_challenges_received: u64,
    pub challenges_successfully_defended: u64,
    pub total_rewards_earned: Balance,
    pub total_stakes_lost: Balance,
    pub last_active_timestamp: U64,
    pub specialization_areas: Vec<String>, // e.g., "financial", "scientific", "news"
    pub average_source_count: f64,
    pub uptime_score: f64, // 0-1 representing availability
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum UserRole {
    User,
    Solver,
    Verifier,
    Admin,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct UserProfile {
    pub account_id: AccountId,
    pub role: UserRole,
    pub registration_date: U64,
    pub is_verified: bool,
    pub verification_level: u8, // 0-5 trust level
    pub total_intents_created: u64,
    pub total_stake_committed: Balance,
}

#[near(contract_state)]
pub struct OracleIntentContract {
    pub owner: AccountId,
    pub intents: UnorderedMap<String, OracleIntent>,
    pub evaluations: UnorderedMap<String, OracleEvaluation>,
    pub challenges: UnorderedMap<String, RefutationChallenge>,
    pub solvers: LookupMap<AccountId, OracleSolver>,
    pub solver_stakes: LookupMap<AccountId, Balance>,
    pub users: LookupMap<AccountId, UserProfile>,
    pub admins: Vector<AccountId>,
    pub verifiers: Vector<AccountId>,
    pub intent_counter: u64,
    pub evaluation_counter: u64,
    pub challenge_counter: u64,
    pub min_stake: Balance,
    pub max_evaluation_time: U64,
    pub challenge_period: U64, // nanoseconds
}

impl Default for OracleIntentContract {
    fn default() -> Self {
        Self {
            owner: env::predecessor_account_id(),
            intents: UnorderedMap::new(b"i"),
            evaluations: UnorderedMap::new(b"e"),
            challenges: UnorderedMap::new(b"c"),
            solvers: LookupMap::new(b"s"),
            solver_stakes: LookupMap::new(b"ss"),
            users: LookupMap::new(b"u"),
            admins: Vector::new(b"a"),
            verifiers: Vector::new(b"v"),
            intent_counter: 0,
            evaluation_counter: 0,
            challenge_counter: 0,
            min_stake: MIN_STAKE,
            max_evaluation_time: U64(300_000_000_000), // 5 minutes in nanoseconds
            challenge_period: U64(86_400_000_000_000), // 24 hours in nanoseconds
        }
    }
}

#[near]
impl OracleIntentContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            intents: UnorderedMap::new(b"i"),
            evaluations: UnorderedMap::new(b"e"),
            challenges: UnorderedMap::new(b"c"),
            solvers: LookupMap::new(b"s"),
            solver_stakes: LookupMap::new(b"ss"),
            users: LookupMap::new(b"u"),
            admins: Vector::new(b"a"),
            verifiers: Vector::new(b"v"),
            intent_counter: 0,
            evaluation_counter: 0,
            challenge_counter: 0,
            min_stake: MIN_STAKE,
            max_evaluation_time: U64(300_000_000_000),
            challenge_period: U64(86_400_000_000_000),
        }
    }

    /// Register a new user
    pub fn register_user(&mut self, role: UserRole) {
        let account_id = env::predecessor_account_id();
        
        require!(!self.users.contains_key(&account_id), "User already registered");
        
        let user_profile = UserProfile {
            account_id: account_id.clone(),
            role: role.clone(),
            registration_date: U64(env::block_timestamp()),
            is_verified: false,
            verification_level: 0,
            total_intents_created: 0,
            total_stake_committed: 0,
        };
        
        self.users.insert(&account_id, &user_profile);
        
        // Add to appropriate role vector
        match role {
            UserRole::Admin => {
                self.assert_owner(); // Only owner can add admins
                self.admins.push(&account_id);
            },
            UserRole::Verifier => {
                self.assert_admin_or_owner();
                self.verifiers.push(&account_id);
            },
            _ => {}
        }
        
        env::log_str(&format!("User {} registered with role {:?}", account_id, role));
    }
    
    /// Verify a user (only by verifiers or admins)
    pub fn verify_user(&mut self, user_id: AccountId, verification_level: u8) {
        self.assert_verifier_or_admin();
        
        require!(verification_level <= 5, "Verification level must be 0-5");
        
        let mut user = self.users.get(&user_id)
            .expect("User not found");
        
        user.is_verified = verification_level > 0;
        user.verification_level = verification_level;
        
        self.users.insert(&user_id, &user);
        
        env::log_str(&format!("User {} verified at level {}", user_id, verification_level));
    }
    
    /// Update user role (only by admins)
    pub fn update_user_role(&mut self, user_id: AccountId, new_role: UserRole) {
        self.assert_admin_or_owner();
        
        let mut user = self.users.get(&user_id)
            .expect("User not found");
        
        // Remove from old role vectors if applicable
        match user.role {
            UserRole::Admin => {
                self.admins.retain(|&admin| admin != user_id);
            },
            UserRole::Verifier => {
                self.verifiers.retain(|&verifier| verifier != user_id);
            },
            _ => {}
        }
        
        // Add to new role vectors if applicable
        match new_role {
            UserRole::Admin => {
                self.admins.push(&user_id);
            },
            UserRole::Verifier => {
                self.verifiers.push(&user_id);
            },
            _ => {}
        }
        
        user.role = new_role.clone();
        self.users.insert(&user_id, &user);
        
        env::log_str(&format!("User {} role updated to {:?}", user_id, new_role));
    }

    /// Register as an oracle solver
    #[payable]
    pub fn register_solver(&mut self) {
        let solver_id = env::predecessor_account_id();
        let stake = env::attached_deposit();
        
        require!(stake >= self.min_stake, "Insufficient stake to register as solver");

        let solver = OracleSolver {
            solver_id: solver_id.clone(),
            reputation_score: 1.0,
            total_evaluations: 0,
            successful_evaluations: 0,
            total_stake: stake,
            is_active: true,
            performance_metrics: SolverPerformanceMetrics {
                average_execution_time: 0.0,
                average_confidence_score: 0.0,
                total_challenges_received: 0,
                challenges_successfully_defended: 0,
                total_rewards_earned: 0,
                total_stakes_lost: 0,
                last_active_timestamp: U64(env::block_timestamp()),
                specialization_areas: vec![],
                average_source_count: 0.0,
                uptime_score: 1.0,
            },
        };

        self.solvers.insert(&solver_id, &solver);
        self.solver_stakes.insert(&solver_id, &stake);
        
        env::log_str(&format!("Solver {} registered with stake {}", solver_id, stake));
    }

    /// Accept an intent for execution (solver claims intent)
    pub fn accept_intent(&mut self, intent_id: String) -> bool {
        let solver = env::predecessor_account_id();
        
        // Verify solver is registered and has sufficient stake
        require!(self.solvers.contains_key(&solver), "Solver not registered");
        let solver_info = self.solvers.get(&solver).unwrap();
        require!(solver_info.is_active, "Solver is not active");
        
        let mut intent = self.intents.get(&intent_id)
            .expect("Intent not found");
        
        require!(intent.status == IntentStatus::Pending, "Intent is not pending");
        require!(env::block_timestamp() <= intent.deadline.0, "Intent has expired");
        
        // Check if solver has sufficient reputation for high-value intents
        if intent.reward > 5 * MIN_STAKE {
            require!(solver_info.reputation_score >= 0.7, "Insufficient reputation for high-value intent");
        }
        
        intent.status = IntentStatus::InProgress;
        self.intents.insert(&intent_id, &intent);
        
        env::log_str(&format!("Intent {} accepted by solver {}", intent_id, solver));
        true
    }
    
    /// Complete intent execution with result
    pub fn complete_intent_execution(
        &mut self,
        intent_id: String,
        evaluation_id: String,
    ) -> bool {
        let solver = env::predecessor_account_id();
        
        let mut intent = self.intents.get(&intent_id)
            .expect("Intent not found");
        
        require!(intent.status == IntentStatus::InProgress, "Intent is not in progress");
        
        let evaluation = self.evaluations.get(&evaluation_id)
            .expect("Evaluation not found");
        
        require!(evaluation.solver == solver, "Only the assigned solver can complete this intent");
        require!(evaluation.intent_id == intent_id, "Evaluation does not match intent");
        
        intent.status = IntentStatus::Completed;
        intent.evaluation_hash = Some(evaluation_id);
        self.intents.insert(&intent_id, &intent);
        
        // Update user statistics
        if let Some(mut user) = self.users.get(&intent.initiator) {
            user.total_intents_created += 1;
            user.total_stake_committed += intent.stake;
            self.users.insert(&intent.initiator, &user);
        }
        
        env::log_str(&format!("Intent {} completed by solver {}", intent_id, solver));
        true
    }

    /// Submit credibility evaluation intent
    #[payable]
    pub fn submit_credibility_intent(
        &mut self,
        question: String,
        required_sources: Option<u32>,
        confidence_threshold: Option<f64>,
        deadline_minutes: Option<u64>,
    ) -> String {
        let initiator = env::predecessor_account_id();
        let stake = env::attached_deposit();
        let reward = stake;
        
        require!(stake >= self.min_stake, "Insufficient stake for intent");
        require!(!question.is_empty(), "Question cannot be empty");
        require!(question.len() <= MAX_QUESTION_LENGTH, "Question too long");
        
        // Gas optimization: validate required_sources early
        let sources_required = required_sources.unwrap_or(3);
        require!(sources_required <= MAX_SOURCES_PER_EVALUATION as u32, "Too many sources required");

        self.intent_counter += 1;
        let intent_id = format!("intent_{}", self.intent_counter);
        
        let deadline = env::block_timestamp() + 
            (deadline_minutes.unwrap_or(60) * 60 * 1_000_000_000); // Convert minutes to nanoseconds

        let intent = OracleIntent {
            intent_id: intent_id.clone(),
            intent_type: IntentType::CredibilityEvaluation,
            initiator,
            question: Some(question.clone()),
            evaluation_hash: None,
            challenge_hash: None,
            stake,
            reward,
            deadline: U64(deadline),
            status: IntentStatus::Pending,
            created_at: U64(env::block_timestamp()),
        };

        self.intents.insert(&intent_id, &intent);
        
        env::log_str(&format!(
            "Credibility intent {} submitted for question: {}", 
            intent_id, question
        ));

        intent_id
    }

    /// Submit evaluation result for an intent
    #[payable]
    pub fn submit_evaluation(
        &mut self,
        intent_id: String,
        answer: bool,
        confidence: f64,
        sources: Vec<Source>,
        execution_time_ms: U64,
    ) -> String {
        let solver = env::predecessor_account_id();
        let solver_stake = env::attached_deposit();
        
        require!(solver_stake >= self.min_stake, "Insufficient solver stake");
        require!(confidence >= 0.0 && confidence <= 1.0, "Confidence must be between 0 and 1");
        require!(!sources.is_empty(), "At least one source is required");
        require!(sources.len() <= MAX_SOURCES_PER_EVALUATION, "Too many sources");
        
        // Gas optimization: validate sources early
        for source in &sources {
            require!(source.url.len() <= MAX_URL_LENGTH, "Source URL too long");
            require!(!source.title.is_empty(), "Source title cannot be empty");
        }
        
        let mut intent = self.intents.get(&intent_id)
            .expect("Intent not found");
        
        require!(intent.status == IntentStatus::Pending, "Intent is not pending");
        require!(env::block_timestamp() <= intent.deadline.0, "Intent has expired");
        
        // Verify solver is registered
        require!(self.solvers.contains_key(&solver), "Solver not registered");

        self.evaluation_counter += 1;
        let evaluation_id = format!("eval_{}", self.evaluation_counter);
        
        let evaluation = OracleEvaluation {
            evaluation_id: evaluation_id.clone(),
            intent_id: intent_id.clone(),
            solver: solver.clone(),
            question: intent.question.clone().unwrap_or_default(),
            answer,
            confidence,
            sources,
            execution_time: execution_time_ms,
            stake: solver_stake,
            status: EvaluationStatus::Submitted,
            submitted_at: U64(env::block_timestamp()),
        };

        self.evaluations.insert(&evaluation_id, &evaluation);
        
        // Update intent status
        intent.status = IntentStatus::InProgress;
        intent.evaluation_hash = Some(evaluation_id.clone());
        self.intents.insert(&intent_id, &intent);

        env::log_str(&format!(
            "Evaluation {} submitted by {} for intent {}", 
            evaluation_id, solver, intent_id
        ));

        evaluation_id
    }

    /// Challenge an evaluation with counter-evidence
    #[payable]
    pub fn submit_challenge(
        &mut self,
        evaluation_id: String,
        counter_sources: Vec<Source>,
    ) -> String {
        let challenger = env::predecessor_account_id();
        let challenge_stake = env::attached_deposit();
        
        let evaluation = self.evaluations.get(&evaluation_id)
            .expect("Evaluation not found");
        
        require!(
            challenge_stake > evaluation.stake, 
            "Challenge stake must be higher than evaluation stake"
        );
        require!(!counter_sources.is_empty(), "Counter sources required");
        require!(
            evaluation.status == EvaluationStatus::Submitted,
            "Evaluation cannot be challenged"
        );

        // Check if challenge period is still open
        let challenge_deadline = evaluation.submitted_at.0 + self.challenge_period.0;
        require!(
            env::block_timestamp() <= challenge_deadline,
            "Challenge period has expired"
        );

        self.challenge_counter += 1;
        let challenge_id = format!("challenge_{}", self.challenge_counter);
        
        let challenge = RefutationChallenge {
            challenge_id: challenge_id.clone(),
            evaluation_id: evaluation_id.clone(),
            challenger: challenger.clone(),
            counter_sources,
            stake: challenge_stake,
            status: ChallengeStatus::Submitted,
            submitted_at: U64(env::block_timestamp()),
        };

        self.challenges.insert(&challenge_id, &challenge);
        
        // Update evaluation status
        let mut updated_evaluation = evaluation;
        updated_evaluation.status = EvaluationStatus::Challenged;
        self.evaluations.insert(&evaluation_id, &updated_evaluation);

        env::log_str(&format!(
            "Challenge {} submitted by {} for evaluation {}", 
            challenge_id, challenger, evaluation_id
        ));

        challenge_id
    }

    /// Settle a dispute between evaluation and challenge
    pub fn settle_dispute(
        &mut self,
        evaluation_id: String,
        challenge_id: String,
        winner: String, // "evaluator", "challenger", or "tie"
    ) {
        self.assert_owner();
        
        let evaluation = self.evaluations.get(&evaluation_id)
            .expect("Evaluation not found");
        let challenge = self.challenges.get(&challenge_id)
            .expect("Challenge not found");
        
        require!(
            evaluation.status == EvaluationStatus::Challenged,
            "Evaluation is not in challenged state"
        );

        let total_stake = evaluation.stake + challenge.stake;
        
        match winner.as_str() {
            "evaluator" => {
                // Evaluator wins, gets their stake back + challenge stake
                self.transfer_reward(&evaluation.solver, total_stake);
                self.update_solver_reputation(&evaluation.solver, true);
                self.update_solver_challenge_metrics(&evaluation.solver, true);
                self.update_solver_reputation(&challenge.challenger, false);
                
                // Update performance metrics for successful defense
                self.update_solver_performance_metrics(
                    &evaluation.solver,
                    evaluation.execution_time.0 as f64,
                    evaluation.confidence,
                    evaluation.sources.len() as u64,
                    total_stake
                );
            },
            "challenger" => {
                // Challenger wins, gets their stake back + evaluation stake  
                self.transfer_reward(&challenge.challenger, total_stake);
                self.update_solver_reputation(&challenge.challenger, true);
                self.update_solver_challenge_metrics(&evaluation.solver, false);
                self.update_solver_reputation(&evaluation.solver, false);
                
                // Track lost stakes for the evaluator
                if let Some(mut solver) = self.solvers.get(&evaluation.solver) {
                    solver.performance_metrics.total_stakes_lost += evaluation.stake;
                    self.solvers.insert(&evaluation.solver, &solver);
                }
            },
            "tie" => {
                // Tie, everyone gets their stake back
                self.transfer_reward(&evaluation.solver, evaluation.stake);
                self.transfer_reward(&challenge.challenger, challenge.stake);
            },
            _ => env::panic_str("Invalid winner specification"),
        }

        env::log_str(&format!("Dispute settled: {} wins", winner));
    }
    
    /// Distribute rewards based on performance and reputation
    pub fn distribute_performance_rewards(&mut self, total_reward_pool: Balance) {
        self.assert_owner();
        
        let active_solvers: Vec<_> = self.solvers
            .values()
            .filter(|solver| solver.is_active && solver.total_evaluations > 0)
            .collect();
            
        if active_solvers.is_empty() {
            return;
        }
        
        let total_weighted_score: f64 = active_solvers
            .iter()
            .map(|solver| self.calculate_weighted_performance_score(solver))
            .sum();
            
        for solver in active_solvers {
            let weighted_score = self.calculate_weighted_performance_score(&solver);
            let reward_share = (weighted_score / total_weighted_score) * total_reward_pool as f64;
            let reward_amount = reward_share as Balance;
            
            if reward_amount > 0 {
                self.transfer_reward(&solver.solver_id, reward_amount);
                
                // Update solver metrics
                if let Some(mut solver_mut) = self.solvers.get(&solver.solver_id) {
                    solver_mut.performance_metrics.total_rewards_earned += reward_amount;
                    self.solvers.insert(&solver.solver_id, &solver_mut);
                }
                
                env::log_str(&format!(
                    "Performance reward {} distributed to solver {}", 
                    reward_amount, 
                    solver.solver_id
                ));
            }
        }
    }
    
    /// Calculate automatic reward for successful evaluation (no challenges)
    pub fn finalize_evaluation_reward(&mut self, evaluation_id: String) -> Balance {
        let evaluation = self.evaluations.get(&evaluation_id)
            .expect("Evaluation not found");
            
        require!(
            evaluation.status == EvaluationStatus::Submitted,
            "Evaluation already finalized"
        );
        
        // Check if challenge period has expired
        let challenge_deadline = evaluation.submitted_at.0 + self.challenge_period.0;
        require!(
            env::block_timestamp() > challenge_deadline,
            "Challenge period still active"
        );
        
        let intent = self.intents.get(&evaluation.intent_id)
            .expect("Intent not found");
            
        // Calculate base reward
        let mut total_reward = intent.reward + evaluation.stake;
        
        // Apply reputation multiplier
        if let Some(solver) = self.solvers.get(&evaluation.solver) {
            let reputation_multiplier = 1.0 + (solver.reputation_score - 0.5) * 0.5; // 0.75x to 1.25x
            total_reward = (total_reward as f64 * reputation_multiplier) as Balance;
            
            // Apply performance bonus for fast execution
            let execution_time_seconds = evaluation.execution_time.0 as f64 / 1000.0;
            if execution_time_seconds < 60.0 { // Under 1 minute
                let speed_bonus = (60.0 - execution_time_seconds) / 60.0 * 0.1; // Up to 10% bonus
                total_reward = (total_reward as f64 * (1.0 + speed_bonus)) as Balance;
            }
        }
        
        // Transfer reward
        self.transfer_reward(&evaluation.solver, total_reward);
        
        // Update evaluation status
        let mut updated_evaluation = evaluation;
        updated_evaluation.status = EvaluationStatus::Confirmed;
        self.evaluations.insert(&evaluation_id, &updated_evaluation);
        
        // Update solver performance metrics
        self.update_solver_performance_metrics(
            &updated_evaluation.solver,
            updated_evaluation.execution_time.0 as f64,
            updated_evaluation.confidence,
            updated_evaluation.sources.len() as u64,
            total_reward
        );
        
        env::log_str(&format!(
            "Evaluation {} finalized with reward {} for solver {}", 
            evaluation_id, 
            total_reward, 
            updated_evaluation.solver
        ));
        
        total_reward
    }
    
    /// Calculate weighted performance score for reward distribution
    fn calculate_weighted_performance_score(&self, solver: &OracleSolver) -> f64 {
        let base_score = solver.reputation_score;
        let activity_bonus = (solver.total_evaluations as f64).ln().max(0.0) * 0.1;
        let challenge_defense_bonus = if solver.performance_metrics.total_challenges_received > 0 {
            (solver.performance_metrics.challenges_successfully_defended as f64 / 
             solver.performance_metrics.total_challenges_received as f64) * 0.2
        } else {
            0.1 // Small bonus for no challenges (implies good work)
        };
        
        let speed_bonus = if solver.performance_metrics.average_execution_time > 0.0 {
            (300000.0 / solver.performance_metrics.average_execution_time).min(0.3) // Up to 30% bonus for speed
        } else {
            0.0
        };
        
        base_score + activity_bonus + challenge_defense_bonus + speed_bonus
    }
    
    /// Batch process multiple operations for gas efficiency
    pub fn batch_process_expired_and_cleanup(&mut self, max_operations: u32) -> (u32, u32) {
        let mut operations_count = 0;
        let expired_count = self.process_expired_intents();
        operations_count += expired_count;
        
        if operations_count < max_operations {
            let remaining_ops = max_operations - operations_count;
            let cleanup_count = self.cleanup_old_data_limited(30, remaining_ops);
            (expired_count, cleanup_count)
        } else {
            (expired_count, 0)
        }
    }
    
    /// Limited cleanup to control gas usage
    fn cleanup_old_data_limited(&mut self, retention_days: u64, max_deletions: u32) -> u32 {
        self.assert_owner();
        
        let retention_period = retention_days * 24 * 60 * 60 * 1_000_000_000;
        let cutoff_time = env::block_timestamp().saturating_sub(retention_period);
        let mut cleaned_count = 0;
        
        // Clean up old intents (limited)
        let old_intent_ids: Vec<String> = self.intents
            .values()
            .filter(|intent| {
                intent.created_at.0 < cutoff_time && 
                (intent.status == IntentStatus::Completed || 
                 intent.status == IntentStatus::Settled ||
                 intent.status == IntentStatus::Expired)
            })
            .take(max_deletions as usize)
            .map(|intent| intent.intent_id.clone())
            .collect();
        
        for intent_id in old_intent_ids {
            self.intents.remove(&intent_id);
            cleaned_count += 1;
            if cleaned_count >= max_deletions {
                break;
            }
        }
        
        cleaned_count
    }
    
    /// Get storage usage statistics
    pub fn get_storage_stats(&self) -> (u64, u64, u64, u64) {
        (
            self.intents.len(),
            self.evaluations.len(), 
            self.challenges.len(),
            self.users.len()
        )
    }

    /// Process expired intents and return stakes
    pub fn process_expired_intents(&mut self) -> u32 {
        let current_time = env::block_timestamp();
        let mut expired_count = 0;
        let mut expired_intent_ids = Vec::new();
        
        // Find expired intents
        for intent in self.intents.values() {
            if intent.deadline.0 < current_time && intent.status == IntentStatus::Pending {
                expired_intent_ids.push(intent.intent_id.clone());
            }
        }
        
        // Process expired intents
        for intent_id in expired_intent_ids {
            if let Some(mut intent) = self.intents.get(&intent_id) {
                intent.status = IntentStatus::Expired;
                self.intents.insert(&intent_id, &intent);
                
                // Return stake to initiator
                self.transfer_reward(&intent.initiator, intent.stake);
                expired_count += 1;
                
                env::log_str(&format!("Intent {} expired, stake returned to {}", intent_id, intent.initiator));
            }
        }
        
        expired_count
    }

    /// Clean up expired intents and evaluations older than retention period
    pub fn cleanup_old_data(&mut self, retention_days: u64) -> u32 {
        self.assert_owner();
        
        let retention_period = retention_days * 24 * 60 * 60 * 1_000_000_000; // Convert days to nanoseconds
        let cutoff_time = env::block_timestamp().saturating_sub(retention_period);
        let mut cleaned_count = 0;
        
        // Clean up old intents
        let mut old_intent_ids = Vec::new();
        for intent in self.intents.values() {
            if intent.created_at.0 < cutoff_time && 
               (intent.status == IntentStatus::Completed || 
                intent.status == IntentStatus::Settled ||
                intent.status == IntentStatus::Expired) {
                old_intent_ids.push(intent.intent_id.clone());
            }
        }
        
        for intent_id in old_intent_ids {
            self.intents.remove(&intent_id);
            cleaned_count += 1;
        }
        
        // Clean up old evaluations
        let mut old_evaluation_ids = Vec::new();
        for evaluation in self.evaluations.values() {
            if evaluation.submitted_at.0 < cutoff_time &&
               (evaluation.status == EvaluationStatus::Confirmed || 
                evaluation.status == EvaluationStatus::Refuted) {
                old_evaluation_ids.push(evaluation.evaluation_id.clone());
            }
        }
        
        for evaluation_id in old_evaluation_ids {
            self.evaluations.remove(&evaluation_id);
            cleaned_count += 1;
        }
        
        // Clean up old challenges
        let mut old_challenge_ids = Vec::new();
        for challenge in self.challenges.values() {
            if challenge.submitted_at.0 < cutoff_time &&
               (challenge.status == ChallengeStatus::Successful || 
                challenge.status == ChallengeStatus::Failed) {
                old_challenge_ids.push(challenge.challenge_id.clone());
            }
        }
        
        for challenge_id in old_challenge_ids {
            self.challenges.remove(&challenge_id);
            cleaned_count += 1;
        }
        
        env::log_str(&format!("Cleaned up {} old records", cleaned_count));
        cleaned_count
    }

    /// Automatic cleanup that can be called by anyone (gas-efficient)
    pub fn auto_cleanup(&mut self) -> u32 {
        let expired_count = self.process_expired_intents();
        
        // Only perform expensive cleanup operations occasionally
        if self.intent_counter % 100 == 0 {
            expired_count + self.cleanup_old_data(30) // Clean data older than 30 days
        } else {
            expired_count
        }
    }

    /// View methods
    pub fn get_intent(&self, intent_id: String) -> Option<OracleIntent> {
        self.intents.get(&intent_id)
    }

    pub fn get_evaluation(&self, evaluation_id: String) -> Option<OracleEvaluation> {
        self.evaluations.get(&evaluation_id)
    }

    pub fn get_challenge(&self, challenge_id: String) -> Option<RefutationChallenge> {
        self.challenges.get(&challenge_id)
    }

    pub fn get_solver(&self, solver_id: AccountId) -> Option<OracleSolver> {
        self.solvers.get(&solver_id)
    }

    pub fn get_pending_intents(&self) -> Vec<OracleIntent> {
        self.intents
            .values()
            .filter(|intent| intent.status == IntentStatus::Pending)
            .collect()
    }
    
    pub fn get_user_profile(&self, user_id: AccountId) -> Option<UserProfile> {
        self.users.get(&user_id)
    }
    
    pub fn get_all_admins(&self) -> Vec<AccountId> {
        self.admins.to_vec()
    }
    
    pub fn get_all_verifiers(&self) -> Vec<AccountId> {
        self.verifiers.to_vec()
    }
    
    pub fn is_user_registered(&self, user_id: AccountId) -> bool {
        self.users.contains_key(&user_id)
    }
    
    pub fn get_intents_by_status(&self, status: IntentStatus) -> Vec<OracleIntent> {
        self.intents
            .values()
            .filter(|intent| intent.status == status)
            .collect()
    }
    
    pub fn get_intents_by_initiator(&self, initiator: AccountId) -> Vec<OracleIntent> {
        self.intents
            .values()
            .filter(|intent| intent.initiator == initiator)
            .collect()
    }
    
    pub fn get_solver_active_intents(&self, solver: AccountId) -> Vec<OracleIntent> {
        let solver_evaluations: Vec<String> = self.evaluations
            .values()
            .filter(|eval| eval.solver == solver)
            .map(|eval| eval.intent_id.clone())
            .collect();
            
        self.intents
            .values()
            .filter(|intent| {
                intent.status == IntentStatus::InProgress &&
                solver_evaluations.contains(&intent.intent_id)
            })
            .collect()
    }
    
    pub fn get_intent_execution_progress(&self, intent_id: String) -> Option<(IntentStatus, Option<String>, u64)> {
        if let Some(intent) = self.intents.get(&intent_id) {
            let time_remaining = if intent.deadline.0 > env::block_timestamp() {
                intent.deadline.0 - env::block_timestamp()
            } else {
                0
            };
            
            Some((intent.status.clone(), intent.evaluation_hash.clone(), time_remaining))
        } else {
            None
        }
    }
    
    pub fn get_solver_performance_metrics(&self, solver_id: AccountId) -> Option<SolverPerformanceMetrics> {
        if let Some(solver) = self.solvers.get(&solver_id) {
            Some(solver.performance_metrics.clone())
        } else {
            None
        }
    }
    
    pub fn get_top_performers(&self, limit: u32) -> Vec<(AccountId, f64, SolverPerformanceMetrics)> {
        let mut solvers: Vec<_> = self.solvers
            .values()
            .filter(|solver| solver.is_active && solver.total_evaluations > 0)
            .map(|solver| (
                solver.solver_id.clone(), 
                solver.reputation_score,
                solver.performance_metrics.clone()
            ))
            .collect();
            
        solvers.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        solvers.truncate(limit as usize);
        solvers
    }
    
    pub fn get_solver_specialization(&self, solver_id: AccountId) -> Vec<String> {
        if let Some(solver) = self.solvers.get(&solver_id) {
            solver.performance_metrics.specialization_areas.clone()
        } else {
            vec![]
        }
    }
    
    pub fn update_solver_specialization(&mut self, specialization_areas: Vec<String>) {
        let solver_id = env::predecessor_account_id();
        
        if let Some(mut solver) = self.solvers.get(&solver_id) {
            solver.performance_metrics.specialization_areas = specialization_areas;
            self.solvers.insert(&solver_id, &solver);
        }
    }

    /// Private helper methods
    fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.owner, "Only owner can call this method");
    }
    
    fn assert_admin_or_owner(&self) {
        let caller = env::predecessor_account_id();
        let is_admin = self.admins.iter().any(|admin| admin == caller);
        require!(
            caller == self.owner || is_admin,
            "Only owner or admin can call this method"
        );
    }
    
    fn assert_verifier_or_admin(&self) {
        let caller = env::predecessor_account_id();
        let is_admin = self.admins.iter().any(|admin| admin == caller);
        let is_verifier = self.verifiers.iter().any(|verifier| verifier == caller);
        require!(
            caller == self.owner || is_admin || is_verifier,
            "Only owner, admin, or verifier can call this method"
        );
    }
    
    fn is_user_verified(&self, user_id: &AccountId) -> bool {
        if let Some(user) = self.users.get(user_id) {
            user.is_verified
        } else {
            false
        }
    }

    fn transfer_reward(&self, recipient: &AccountId, amount: Balance) {
        Promise::new(recipient.clone()).transfer(NearToken::from_yoctonear(amount));
    }

    fn update_solver_reputation(&mut self, solver_id: &AccountId, success: bool) {
        if let Some(mut solver) = self.solvers.get(solver_id) {
            solver.total_evaluations += 1;
            if success {
                solver.successful_evaluations += 1;
            }
            solver.reputation_score = 
                solver.successful_evaluations as f64 / solver.total_evaluations as f64;
            
            // Update last active timestamp
            solver.performance_metrics.last_active_timestamp = U64(env::block_timestamp());
            
            self.solvers.insert(solver_id, &solver);
        }
    }
    
    fn update_solver_performance_metrics(
        &mut self, 
        solver_id: &AccountId, 
        execution_time_ms: f64,
        confidence: f64,
        source_count: u64,
        reward_amount: Balance
    ) {
        if let Some(mut solver) = self.solvers.get(solver_id) {
            let metrics = &mut solver.performance_metrics;
            
            // Update averages using incremental calculation
            let total_evals = solver.total_evaluations as f64;
            
            if total_evals > 0.0 {
                metrics.average_execution_time = 
                    (metrics.average_execution_time * (total_evals - 1.0) + execution_time_ms) / total_evals;
                metrics.average_confidence_score = 
                    (metrics.average_confidence_score * (total_evals - 1.0) + confidence) / total_evals;
                metrics.average_source_count = 
                    (metrics.average_source_count * (total_evals - 1.0) + source_count as f64) / total_evals;
            } else {
                metrics.average_execution_time = execution_time_ms;
                metrics.average_confidence_score = confidence;
                metrics.average_source_count = source_count as f64;
            }
            
            metrics.total_rewards_earned += reward_amount;
            metrics.last_active_timestamp = U64(env::block_timestamp());
            
            self.solvers.insert(solver_id, &solver);
        }
    }
    
    fn update_solver_challenge_metrics(&mut self, solver_id: &AccountId, challenge_defended: bool) {
        if let Some(mut solver) = self.solvers.get(solver_id) {
            solver.performance_metrics.total_challenges_received += 1;
            if challenge_defended {
                solver.performance_metrics.challenges_successfully_defended += 1;
            }
            self.solvers.insert(solver_id, &solver);
        }
    }
}