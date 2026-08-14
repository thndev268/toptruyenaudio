#!/bin/bash
sed -i '23,73d' story-platform/frontend/src/services/repositories/ReviewRepository.ts
sed -i 's/const \[\]: StoryReview\[\] = \[/const INITIAL_MOCK_REVIEWS: StoryReview\[\] = \[\];/g' story-platform/frontend/src/services/repositories/ReviewRepository.ts

sed -i '21,98d' story-platform/frontend/src/services/repositories/CommentRepository.ts
sed -i 's/const \[\]: StoryComment\[\] = \[/const INITIAL_MOCK_COMMENTS: StoryComment\[\] = \[\];/g' story-platform/frontend/src/services/repositories/CommentRepository.ts
