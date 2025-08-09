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
}

#[near(contract_state)]
pub struct OracleIntentContract {
    pub owner: AccountId,
    pub intents: UnorderedMap<String, OracleIntent>,
    pub evaluations: UnorderedMap<String, OracleEvaluation>,
    pub challenges: UnorderedMap<String, RefutationChallenge>,
    pub solvers: LookupMap<AccountId, OracleSolver>,
    pub solver_stakes: LookupMap<AccountId, Balance>,
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
            intent_counter: 0,
            evaluation_counter: 0,
            challenge_counter: 0,
            min_stake: MIN_STAKE,
            max_evaluation_time: U64(300_000_000_000),
            challenge_period: U64(86_400_000_000_000),
        }
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
        };

        self.solvers.insert(&solver_id, &solver);
        self.solver_stakes.insert(&solver_id, &stake);
        
        env::log_str(&format!("Solver {} registered with stake {}", solver_id, stake));
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
                self.update_solver_reputation(&challenge.challenger, false);
            },
            "challenger" => {
                // Challenger wins, gets their stake back + evaluation stake  
                self.transfer_reward(&challenge.challenger, total_stake);
                self.update_solver_reputation(&challenge.challenger, true);
                self.update_solver_reputation(&evaluation.solver, false);
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

    /// Private helper methods
    fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.owner, "Only owner can call this method");
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
            self.solvers.insert(solver_id, &solver);
        }
    }
}