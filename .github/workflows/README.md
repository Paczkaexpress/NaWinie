# CI/CD Pipeline Documentation

## Overview

This repository includes a comprehensive GitHub Actions CI/CD pipeline that ensures code quality, security, and functionality for the Python backend components.

## Workflow Structure

### Triggers
- **Manual Dispatch**: Can be triggered manually from the GitHub Actions tab with an option to run the full test suite
- **Pull Requests**: Automatically runs on PRs to the `main` branch
- **Push to Main**: Runs on direct pushes to `main` branch for continuous integration

### Jobs

#### 1. Python Backend Tests (`python-tests`)
- **Matrix Strategy**: Tests against Python 3.10
- **Code Quality Checks**:
  - Linting with `flake8`
- **Testing**: Runs pytest with coverage reporting
- **Coverage**: Uploads coverage reports to Codecov

#### 2. Security Checks (`security-checks`)
- Python dependency vulnerability scanning with `safety`
- Python security linting with `bandit`
- npm audit for Node.js dependencies

#### 3. Integration Tests (`integration-tests`)
- Runs only on full suite or main branch pushes
- Sets up PostgreSQL service for database tests
- Placeholder for integration test commands

#### 4. CI Summary (`ci-summary`)
- Aggregates results from all critical jobs
- Provides clear pass/fail status
- Fails the workflow if critical tests fail

## Usage

### Running the CI Pipeline

1. **Automatic**: The pipeline runs automatically on PRs and pushes to main
2. **Manual**: Go to Actions tab → CI Pipeline → Run workflow
   - Choose "true" for full suite to include integration and performance tests

### Setting Up Your Development Environment

```bash
# Python setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install pytest-cov pytest-xdist flake8 black isort mypy safety bandit

# Run tests locally
pytest --cov=. --cov-report=term-missing -v
```

### Code Quality Standards

The CI enforces these standards:
- **flake8**: Python linting

## Customization

### Adding Environment Variables

Add secrets in GitHub Settings → Secrets and variables → Actions:
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

### Adding New Test Categories

1. Create new job in `.github/workflows/ci.yml`
2. Add appropriate dependencies and setup
3. Update the `ci-summary` job dependencies

### Database Services

The workflow includes PostgreSQL service setup. Modify as needed:
```yaml
services:
  postgres:
    image: postgres:13
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: your_db_name
```

## Recommended Additional Steps

### 1. Container Security Scanning
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
```

### 2. Documentation Generation
```yaml
- name: Generate API docs
  run: |
    pip install sphinx
    sphinx-build -b html docs/ docs/_build/
```

### 3. Docker Build and Push
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: your-registry/your-app:${{ github.sha }}
```

### 4. Deployment
```yaml
deploy:
  needs: [python-tests, security-checks]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to staging
      run: |
        # Add deployment commands here
```

### 5. Notification Setup
```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

1. **Keep workflows fast**: Use caching and parallel jobs
2. **Secure secrets**: Never hardcode sensitive information
3. **Version pin actions**: Use specific versions for stability
4. **Monitor resource usage**: Be mindful of GitHub Actions minutes
5. **Regular updates**: Keep actions and dependencies up to date

## Troubleshooting

### Common Issues

1. **Python version conflicts**: Ensure your code works with all matrix versions
2. **npm audit failures**: Update dependencies or add audit exceptions
3. **Coverage drops**: Set minimum coverage thresholds
4. **Flaky tests**: Use pytest-xdist for parallel execution

### Debugging Failed Runs

1. Check the specific job that failed
2. Look at the step-by-step logs
3. Run the same commands locally
4. Use GitHub Actions debugging by adding `ACTIONS_STEP_DEBUG: true` secret

## Status Badges

Add these to your main README.md:
```markdown
![CI Pipeline](https://github.com/your-username/your-repo/workflows/CI%20Pipeline/badge.svg)
[![codecov](https://codecov.io/gh/your-username/your-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/your-repo)
``` 