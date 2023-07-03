package services

import (
	"os"
	"time"

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
