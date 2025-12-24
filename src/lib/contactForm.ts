interface Web3FormsResponse {
  success: boolean;
  message?: string;
}

interface FormDataObject {
  [key: string]: string;
}

interface RateLimitInfo {
  lastSubmission: number;
  submissionCount: number;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MIN_TIME_BETWEEN_SUBMISSIONS: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_SUBMISSIONS_PER_HOUR: 3,
  STORAGE_KEY: 'contact_form_rate_limit',
} as const;

/**
 * Check if the user can submit the form based on rate limiting
 * @returns Object with canSubmit boolean and optional error message
 */
function checkRateLimit(): { canSubmit: boolean; errorMessage?: string } {
  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_CONFIG.STORAGE_KEY);
  
  if (!stored) {
    // First submission, allow it
    return { canSubmit: true };
  }

  try {
    const rateLimitInfo: RateLimitInfo = JSON.parse(stored);
    const timeSinceLastSubmission = now - rateLimitInfo.lastSubmission;
    
    // Check minimum time between submissions
    if (timeSinceLastSubmission < RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS) {
      const minutesRemaining = Math.ceil(
        (RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS - timeSinceLastSubmission) / (60 * 1000)
      );
      return {
        canSubmit: false,
        errorMessage: `Please wait ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} before submitting again.`
      };
    }

    // Check submissions per hour (reset count if more than an hour has passed)
    const oneHourAgo = now - (60 * 60 * 1000);
    if (rateLimitInfo.lastSubmission < oneHourAgo) {
      // Reset count if last submission was more than an hour ago
      return { canSubmit: true };
    }

    if (rateLimitInfo.submissionCount >= RATE_LIMIT_CONFIG.MAX_SUBMISSIONS_PER_HOUR) {
      const timeUntilReset = Math.ceil((60 * 60 * 1000 - (now - rateLimitInfo.lastSubmission)) / (60 * 1000));
      return {
        canSubmit: false,
        errorMessage: `You've reached the maximum number of submissions. Please try again in ${timeUntilReset} minute${timeUntilReset > 1 ? 's' : ''}.`
      };
    }

    return { canSubmit: true };
  } catch (error) {
    // If there's an error parsing, allow submission but log the error
    console.error('Error parsing rate limit data:', error);
    return { canSubmit: true };
  }
}

/**
 * Update rate limit information after a successful submission
 */
function updateRateLimit(): void {
  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_CONFIG.STORAGE_KEY);
  
  let rateLimitInfo: RateLimitInfo;
  
  if (!stored) {
    rateLimitInfo = {
      lastSubmission: now,
      submissionCount: 1
    };
  } else {
    try {
      rateLimitInfo = JSON.parse(stored);
      const oneHourAgo = now - (60 * 60 * 1000);
      
      // Reset count if last submission was more than an hour ago
      if (rateLimitInfo.lastSubmission < oneHourAgo) {
        rateLimitInfo = {
          lastSubmission: now,
          submissionCount: 1
        };
      } else {
        rateLimitInfo.lastSubmission = now;
        rateLimitInfo.submissionCount = (rateLimitInfo.submissionCount || 0) + 1;
      }
    } catch (error) {
      // If parsing fails, start fresh
      rateLimitInfo = {
        lastSubmission: now,
        submissionCount: 1
      };
    }
  }

  localStorage.setItem(RATE_LIMIT_CONFIG.STORAGE_KEY, JSON.stringify(rateLimitInfo));
}

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const successMessage = document.getElementById('success-message') as HTMLElement | null;
  const errorMessage = document.getElementById('error-message') as HTMLElement | null;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  const submitText = document.getElementById('submit-text') as HTMLElement | null;
  const submitLoading = document.getElementById('submit-loading') as HTMLElement | null;
  const resetFormBtn = document.getElementById('reset-form-btn') as HTMLButtonElement | null;

  if (!form || !successMessage || !errorMessage || !submitBtn || !submitText || !submitLoading || !resetFormBtn) {
    console.error('Required form elements not found');
    return;
  }

  form.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    
    // Hide error message if it was shown before
    errorMessage.classList.add('hidden');
    
    // Check honeypot field (bots might fill this)
    const honeypot = form.querySelector('[name="website"]') as HTMLInputElement | null;
    if (honeypot && honeypot.value) {
      // Bot detected - silently fail
      console.warn('Bot detected via honeypot field');
      return;
    }

    // Check rate limiting
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.canSubmit) {
      const errorText = errorMessage.querySelector('p');
      if (errorText) {
        errorText.textContent = rateLimitCheck.errorMessage || 'Please wait before submitting again.';
      }
      errorMessage.classList.remove('hidden');
      return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    // Get form data
    const formData = new FormData(form);
    
    // Convert to object for JSON submission (exclude honeypot)
    const data: FormDataObject = {};
    formData.forEach((value: FormDataEntryValue, key: string): void => {
      // Skip honeypot field
      if (key === 'website') {
        return;
      }
      if (typeof value === 'string') {
        data[key] = value;
      }
    });

    try {
      const response: Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result: Web3FormsResponse = await response.json() as Web3FormsResponse;

      if (result.success) {
        // Update rate limit after successful submission
        updateRateLimit();
        
        // Show success message and hide form
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
      } else {
        // Show error message
        errorMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
      }
    } catch (error: unknown) {
      // Show error message
      console.error('Form submission error:', error);
      errorMessage.classList.remove('hidden');
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });

  // Reset form button handler
  resetFormBtn.addEventListener('click', (): void => {
    form.reset();
    form.style.display = 'block';
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    submitLoading.classList.add('hidden');
  });
}