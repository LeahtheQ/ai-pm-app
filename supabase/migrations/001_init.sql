-- AI PM App 초기 스키마
-- 작성일: 2026-05-16

-- 대화 세션
CREATE TABLE conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  title      TEXT        NOT NULL DEFAULT '새 대화',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 메시지 기록
CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  agent_used      TEXT,
  skills_used     TEXT[]      DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Eval 결과
CREATE TABLE evaluations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id          UUID        REFERENCES messages(id) ON DELETE CASCADE,
  score_accuracy      INT         CHECK (score_accuracy BETWEEN 0 AND 10),
  score_expertise     INT         CHECK (score_expertise BETWEEN 0 AND 10),
  score_completeness  INT         CHECK (score_completeness BETWEEN 0 AND 10),
  score_language      INT         CHECK (score_language BETWEEN 0 AND 10),
  total_score         INT         GENERATED ALWAYS AS (
                                    score_accuracy + score_expertise +
                                    score_completeness + score_language
                                  ) STORED,
  feedback            TEXT,
  evaluated_at        TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base
CREATE TABLE knowledge_base (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  file_name    TEXT        NOT NULL,
  file_url     TEXT,
  content_text TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 접근
CREATE POLICY "conversations_self" ON conversations
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
              OR user_id = current_setting('request.headers', true)::jsonb->>'x-user-id');

CREATE POLICY "messages_via_conversation" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = current_setting('request.headers', true)::jsonb->>'x-user-id'
    )
  );

CREATE POLICY "evaluations_via_message" ON evaluations
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = current_setting('request.headers', true)::jsonb->>'x-user-id'
    )
  );

CREATE POLICY "knowledge_base_self" ON knowledge_base
  FOR ALL USING (user_id = current_setting('request.headers', true)::jsonb->>'x-user-id');

-- 인덱스
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_evaluations_message   ON evaluations(message_id);
CREATE INDEX idx_conversations_user    ON conversations(user_id);
CREATE INDEX idx_knowledge_base_user   ON knowledge_base(user_id);
