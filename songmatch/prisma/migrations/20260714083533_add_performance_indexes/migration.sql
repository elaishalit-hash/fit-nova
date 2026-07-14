-- CreateIndex
CREATE INDEX "Match_artistProfileId_idx" ON "Match"("artistProfileId");

-- CreateIndex
CREATE INDEX "Match_songwriterProfileId_idx" ON "Match"("songwriterProfileId");

-- CreateIndex
CREATE INDEX "Message_matchId_idx" ON "Message"("matchId");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
