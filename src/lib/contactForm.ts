import { trackFormEvent } from './analytics';

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

const RATE_LIMIT_CONFIG = {
  MIN_TIME_BETWEEN_SUBMISSIONS: 5 * 60 * 1000,
  MAX_SUBMISSIONS_PER_HOUR: 3,
  STORAGE_KEY: 'contact_form_rate_limit',
} as const;

function checkRateLimit(): { canSubmit: boolean; errorMessage?: string } {
  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_CONFIG.STORAGE_KEY);
  
  if (!stored) {
    return { canSubmit: true };
  }

  try {
    const rateLimitInfo: RateLimitInfo = JSON.parse(stored);
    const timeSinceLastSubmission = now - rateLimitInfo.lastSubmission;
    
    if (timeSinceLastSubmission < RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS) {
      const minutesRemaining = Math.ceil(
        (RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_SUBMISSIONS - timeSinceLastSubmission) / (60 * 1000)
      );
      return {
        canSubmit: false,
        errorMessage: `Please wait ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} before submitting again.`
      };
    }

    const oneHourAgo = now - (60 * 60 * 1000);
    // Hourly window has lapsed, so the stored count is stale
    if (rateLimitInfo.lastSubmission < oneHourAgo) {
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
    // Corrupt storage shouldn't lock anyone out of the form
    console.error('Error parsing rate limit data:', error);
    return { canSubmit: true };
  }
}

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

  // astro:page-load also fires on first load; binding twice would double-send
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  let formStarted = false;
  form.addEventListener('focusin', () => {
    if (!formStarted) {
      trackFormEvent('started', 'contact');
      formStarted = true;
    }
  }, { once: true });

  form.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    
    errorMessage.classList.add('hidden');
    
    // Only bots fill the hidden website field
    const honeypot = form.querySelector('[name="website"]') as HTMLInputElement | null;
    if (honeypot && honeypot.value) {
      // Fail silently so the bot gets no signal
      console.warn('Bot detected via honeypot field');
      return;
    }

    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.canSubmit) {
      const errorText = errorMessage.querySelector('p');
      if (errorText) {
        errorText.textContent = rateLimitCheck.errorMessage || 'Please wait before submitting again.';
      }
      errorMessage.classList.remove('hidden');
      trackFormEvent('error', 'contact');
      return;
    }
    
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    const formData = new FormData(form);
    
    const data: FormDataObject = {};
    formData.forEach((value: FormDataEntryValue, key: string): void => {
      // Keep the honeypot out of the email
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
        // Only successful sends count toward the limit
        updateRateLimit();
        trackFormEvent('submitted', 'contact');
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
      } else {
        trackFormEvent('error', 'contact');
        errorMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
      }
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      trackFormEvent('error', 'contact');
      errorMessage.classList.remove('hidden');
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });

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