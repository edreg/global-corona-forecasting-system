<?php

namespace App\Domain\Corona\Model;

class CoronaStatsModel
{
    /**
     * @var string
     */
    public $date;

    /**
     * @var \App\Domain\Corona\Model\CountryModel
     */
    public $country;

    /**
     * @var int
     */
    public $amountTotal;

    /**
     * @var int
     */
    public $amountTotalTheDayBefore;

    /**
     * @var int
     */
    public $amountInfected;

    /**
     * @var int
     */
    public $amountInfectedTheDayBefore;

    /**
     * @var int
     */
    public $amountHealed;

    /**
     * @var int
     */
    public $amountHealedTheDayBefore;

    /**
     * @var int
     */
    public $amountDeath;

    /**
     * @var int
     */
    public $amountDeathTheDayBefore;

    /**
     * @var int
     */
    public $doublingInfectionRate;

    /**
     * @var int
     */
    public $doublingDeathRate;

    /**
     * @var int
     */
    public $doublingHealedRate;

    /**
     * @var int
     */
    public $doublingTotalRate;

    public function __construct(CountryModel $country, string $date)
    {
        $this->date = $date;
        $this->country = $country;
        $this->amountTotal = 0;
        $this->amountTotalTheDayBefore = 0;
        $this->amountInfected = 0;
        $this->amountInfectedTheDayBefore = 0;
        $this->amountHealed = 0;
        $this->amountHealedTheDayBefore = 0;
        $this->amountDeath = 0;
        $this->amountDeathTheDayBefore = 0;
        $this->doublingTotalRate = 0;
        $this->doublingInfectionRate = 0;
        $this->doublingDeathRate = 0;
        $this->doublingHealedRate = 0;
    }

    public function calculate() : void
    {
        $this->amountInfected = $this->amountTotal - $this->amountHealed - $this->amountDeath;
        $this->amountInfectedTheDayBefore = $this->amountTotalTheDayBefore - $this->amountHealedTheDayBefore - $this->amountDeathTheDayBefore;
        $this->calculateDoublingTotalRateInDays();
        $this->calculateDoublingInfectionRateInDays();
        $this->calculateDoublingHealedRateInDays();
        $this->calculateDoublingDeathRateInDays();
    }

    private function calculateDoublingTotalRateInDays() : void
    {
        if ($this->amountTotalTheDayBefore > 0 && $this->amountTotal > 0)
        {
            $log = log($this->amountTotal/$this->amountTotalTheDayBefore);

            if ($log !== (float)0)
            {
                $this->doublingTotalRate = log(2) / $log;
            }
        }
    }

    private function calculateDoublingInfectionRateInDays() : void
    {
        if ($this->amountInfectedTheDayBefore > 0 && $this->amountInfected > 0)
        {
            $log = log($this->amountInfected/$this->amountInfectedTheDayBefore);

            if ($log !== (float)0)
            {
                $this->doublingInfectionRate = log(2) / $log;
            }
        }
    }

    private function calculateDoublingHealedRateInDays() : void
    {
        if ($this->amountHealedTheDayBefore > 0 && $this->amountHealed > 0)
        {
            $log = log($this->amountHealed/$this->amountHealedTheDayBefore);

            if ($log !== (float)0)
            {
                $this->doublingHealedRate = log(2) / $log;
            }
        }
    }

    private function calculateDoublingDeathRateInDays() : void
    {
        if ($this->amountDeathTheDayBefore > 0 && $this->amountDeath > 0)
        {
            $log = log($this->amountDeath/$this->amountDeathTheDayBefore);

            if ($log !== (float)0)
            {
                $this->doublingDeathRate = log(2) / $log;
            }
        }
    }
}