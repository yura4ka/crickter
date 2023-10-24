package services

import (
	"encoding/hex"
	"os"
	"strconv"
	"time"

	"crypto/hmac"
	"crypto/sha256"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const (
	access_max_age  = time.Hour * 24
	refresh_max_age = time.Hour * 24 * 30
)

type TokenPayload struct {
	Id string `json:"id"`
}

type customClaims struct {
	TokenPayload
	jwt.RegisteredClaims
}

func CreateAccessToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(access_max_age)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("ACCESS_TOKEN")))
}

func CreateRefreshToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refresh_max_age)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("REFRESH_TOKEN")))
}

func CreateRefreshCookie(token string) *fiber.Cookie {
	return &fiber.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Expires:  time.Now().Add(refresh_max_age),
		HTTPOnly: true,
	}
}

func VerifyRefreshToken(token string) (*TokenPayload, error) {
	parsed, err := jwt.ParseWithClaims(token, &customClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("REFRESH_TOKEN")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := parsed.Claims.(*customClaims); ok && parsed.Valid {
		return &claims.TokenPayload, nil
	}

	return nil, err
}

func ClearRefreshCookie() *fiber.Cookie {
	return &fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour * 24),
		HTTPOnly: true,
	}
}

func VerifyAccessToken(token string) (*TokenPayload, error) {
	parsed, err := jwt.ParseWithClaims(token, &customClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("ACCESS_TOKEN")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := parsed.Claims.(*customClaims); ok && parsed.Valid {
		return &claims.TokenPayload, nil
	}

	return nil, err
}

func CreateUcareToken(age time.Duration) (string, int64) {
	mac := hmac.New(sha256.New, []byte(os.Getenv("UPLOAD_CARE_SECRET")))
	expire := time.Now().Add(age).Unix()
	mac.Write([]byte(strconv.FormatInt(expire, 10)))
	dataHmac := mac.Sum(nil)
	hmacHex := hex.EncodeToString(dataHmac)
	return hmacHex, expire
}

func GetAccessMaxAge() time.Duration {
	return access_max_age
}
