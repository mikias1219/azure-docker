# Azure Language Studio Configuration Steps

## Step 1: Access Azure Language Studio
1. Go to https://language.cognitive.azure.com/
2. Sign in with your Azure account (mikiyas.a@ienetworks.co)
3. Select your Azure subscription (Microsoft Azure Sponsorship)
4. Select the resource: **azure-language-ai102** (in East US region)

---

## Step 2: Configure Question Answering (Q&A)

### A. Create the Project
1. Click **"Question Answering"** from the home page
2. Click **"Create new project"**
3. Enter project details:
   - **Project name**: `LearnFAQ`
   - **Language**: English
   - **Description**: `Microsoft Learn FAQ knowledge base`
4. Click **Create**

### B. Add Knowledge Base Sources
1. In the left menu, click **"Sources"**
2. Click **"+ Add source"**
3. Select **"URLs"**
4. Add the Microsoft Learn FAQ URL:
   - **Source name**: `Microsoft Learn FAQ`
   - **URL**: `https://docs.microsoft.com/en-us/learn/support/faq`
5. Click **Add all**
6. (Optional) Add more sources:
   - Click **"+ Add source"** → **"Chitchat"**
   - Select **"Friendly"** personality
   - Click **Add**

### C. Add Custom Q&A Pairs (Optional)
1. Click **"Edit knowledge base"**
2. Click **"+ Add question pair"**
3. Add some custom pairs:
   - Q: "What is Microsoft Learn?"
     A: "Microsoft Learn is a free, online training platform that provides interactive learning for Microsoft products and services."
   - Q: "How do I get started?"
     A: "Browse learning paths, modules, and hands-on labs to start building your skills."

### D. Deploy the Knowledge Base
1. Click **"Deploy knowledge base"** in the left menu
2. Click **"Deploy"**
3. Deployment name will be: `production`
4. Wait for deployment to complete (green checkmark)

---

## Step 3: Configure Conversational Language Understanding (CLU) - Clock

### A. Create the Project
1. Go back to the Language Studio home page
2. Click **"Conversational Language Understanding (CLU)"**
3. Click **"Create new project"**
4. Enter project details:
   - **Project name**: `Clock`
   - **Language**: English
   - **Description**: `Natural language clock application`
5. Click **Create**

### B. Add Intents
1. Click **"Intents"** in the left menu
2. Click **"+ Add intent"**
3. Add these 3 intents one by one:
   - `GetTime` - For queries about current time
   - `GetDay` - For queries about day of week
   - `GetDate` - For queries about date

### C. Add Entities
1. Click **"Entities"** in the left menu
2. Click **"+ Add entity"**
3. Add these 3 entities:

**Entity 1: Location**
- Name: `Location`
- Type: `List` or `Simple`
- Used for: City names like "London", "Paris", "New York"

**Entity 2: Weekday**
- Name: `Weekday`
- Type: `List`
- Add values: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

**Entity 3: Date**
- Name: `Date`
- Type: `Prebuilt`** → Select `datetimev2`

### D. Add Utterances
1. Click **"Data labeling"** in the left menu
2. Add these sample utterances for each intent:

**For GetTime intent:**
- "what is the time?"
- "what time is it?"
- "tell me the time"
- "what time is it in London?" (label "London" as Location entity)
- "what's the time in Paris?" (label "Paris" as Location entity)

**For GetDay intent:**
- "what day is it?"
- "what's the day today?"
- "what day of the week is it?"
- "what day was 01/01/2020?" (label date as Date entity)
- "what day will it be on Friday?" (label "Friday" as Weekday entity)

**For GetDate intent:**
- "what date is it?"
- "what's the date?"
- "what is today's date?"
- "what date was it on Saturday?" (label "Saturday" as Weekday entity)
- "what date will it be on Monday?" (label "Monday" as Weekday entity)

3. Click **Save** after adding utterances

### E. Train the Model
1. Click **"Training jobs"** in the left menu
2. Click **"+ Start a training job"**
3. Select:
   - **Model**: `Clock`
   - **Training mode**: Standard
4. Click **Train**
5. Wait for training to complete (check status in the jobs list)

### F. Deploy the Model
1. Click **"Deploying a model"** in the left menu
2. Click **"+ Add deployment"**
3. Enter:
   - **Deployment name**: `production`
   - **Model**: `Clock` (the one you just trained)
4. Click **Deploy**
5. Wait for deployment to complete

---

## Step 4: Test Your Setup

Once both projects are deployed, test them:

### Test Q&A:
```bash
curl -X POST http://4.156.200.140:8000/qna/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is Microsoft Learn?"}'
```

### Test Clock CLU:
```bash
curl -X POST http://4.156.200.140:8000/clock/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"What time is it in London?"}'
```

---

## Troubleshooting

### If Q&A returns "AzureSearchBadState":
- Make sure the knowledge base has at least one source (URL or Q&A pairs)
- Make sure deployment completed successfully
- Try redeploying the knowledge base

### If CLU returns "NotFound":
- Verify the project name is exactly `Clock`
- Verify the deployment name is exactly `production`
- Make sure training completed successfully before deploying

### Still having issues?
- Check Azure Portal → Cognitive Services → azure-language-ai102 → Keys and Endpoint
- Verify the endpoint is: `https://eastus.api.cognitive.microsoft.com/`
- Verify the key is the one for AIServices resource (not TextAnalytics)

---

## Your App URLs:
- **App**: http://4.156.200.140:8000/
- **API Docs**: http://4.156.200.140:8000/docs

Good luck! 🎉
